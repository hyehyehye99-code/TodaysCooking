import Foundation

/// Supabase Realtime(웹소켓)으로 우리집 대화방의 새 메시지를 바로 받는다.
/// 이벤트 내용은 쓰지 않고 "새 글이 왔다"는 신호로만 쓴다 (내용은 평소처럼 서버에서 읽어 와 권한·중복 처리를 그대로 지킨다).
/// 연결이 끊기면 알아서 다시 붙는다. 못 붙는 동안에는 화면의 주기적 새로고침이 대신한다.
@MainActor
final class RealtimeListener {
    private var task: URLSessionWebSocketTask?
    private var run: Task<Void, Never>?
    private let onChange: @MainActor () async -> Void

    init(onChange: @escaping @MainActor () async -> Void) { self.onChange = onChange }

    func start(household: String) {
        stop()
        run = Task { [weak self] in
            var delay = 1.0
            while !Task.isCancelled {
                guard let self else { return }
                let connected = await self.session(household: household)
                delay = connected ? 1.0 : min(delay * 2, 30)
                try? await Task.sleep(for: .seconds(delay))
            }
        }
    }

    func stop() {
        run?.cancel(); run = nil
        task?.cancel(with: .goingAway, reason: nil); task = nil
    }

    /// 한 번 연결해서 끊어질 때까지 듣는다. 한 번이라도 구독에 성공했으면 true
    private func session(household: String) async -> Bool {
        guard let base = Config.supabaseURL, let jwt = try? await Backend.shared.accessToken(),
              var comps = URLComponents(url: base.appendingPathComponent("realtime/v1/websocket"), resolvingAgainstBaseURL: false) else { return false }
        comps.scheme = "wss"
        comps.queryItems = [URLQueryItem(name: "apikey", value: Config.supabaseAnonKey), URLQueryItem(name: "vsn", value: "1.0.0")]
        guard let url = comps.url else { return false }

        let ws = URLSession.shared.webSocketTask(with: url)
        task = ws
        ws.resume()

        let join: [String: Any] = [
            "topic": "realtime:household-messages:\(household)", "event": "phx_join", "ref": "1",
            "payload": [
                "config": [
                    "broadcast": ["self": false], "presence": ["key": ""],
                    "postgres_changes": [["event": "INSERT", "schema": "public", "table": "household_messages", "filter": "household_id=eq.\(household)"]],
                ],
                "access_token": jwt,
            ],
        ]
        guard await send(ws, join) else { return false }

        // 25초마다 살아 있다는 신호, 50분마다 로그인 토큰이 만료되기 전에 새로 연결
        let beat = Task { [weak self] in
            var n = 1
            let started = Date()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(25))
                n += 1
                if await self?.send(ws, ["topic": "phoenix", "event": "heartbeat", "payload": [:], "ref": "\(n)"]) != true { return }
                if Date().timeIntervalSince(started) > 50 * 60 { ws.cancel(with: .goingAway, reason: nil); return }
            }
        }
        defer { beat.cancel(); ws.cancel(with: .goingAway, reason: nil) }

        var subscribed = false
        while !Task.isCancelled {
            guard let message = try? await ws.receive(), case .string(let text) = message,
                  let data = text.data(using: .utf8), let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return subscribed }
            switch obj["event"] as? String {
            case "phx_reply":
                if let payload = obj["payload"] as? [String: Any], payload["status"] as? String == "ok" { subscribed = true }
                else { return subscribed }
            case "postgres_changes": await onChange()
            case "phx_error", "phx_close": return subscribed
            default: break
            }
        }
        return subscribed
    }

    private func send(_ ws: URLSessionWebSocketTask, _ object: [String: Any]) async -> Bool {
        guard let data = try? JSONSerialization.data(withJSONObject: object), let text = String(data: data, encoding: .utf8) else { return false }
        do { try await ws.send(.string(text)); return true } catch { return false }
    }
}

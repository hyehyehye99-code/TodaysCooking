import Foundation

enum BackendError: LocalizedError {
    case notConfigured
    case notSignedIn
    case http(Int, String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "서버 설정이 아직 없어요."
        case .notSignedIn: return "로그인이 필요해요."
        case .http(let code, let message): return message.isEmpty ? "서버 오류(\(code))" : message
        case .decoding(let m): return "응답을 읽지 못했어요. (\(m))"
        }
    }
}

struct AuthSession: Codable, Equatable {
    var accessToken: String
    var refreshToken: String
    var expiresAt: Date
    var userId: String
    var email: String?
}

/// Supabase(Auth · PostgREST · RPC)에 직접 붙는 얇은 클라이언트.
/// 사용자 JWT 로 호출하므로 DB 의 RLS 정책이 웹과 똑같이 적용된다.
actor Backend {
    static let shared = Backend()

    private let sessionKey = "supabase.session"
    private(set) var session: AuthSession?
    private var onSessionChange: (@Sendable (AuthSession?) -> Void)?
    private let urlSession: URLSession

    /// restoreSession: false 는 테스트용 — 키체인의 실제 로그인 세션을 읽지 않는다
    init(urlSession: URLSession = .shared, restoreSession: Bool = true) {
        self.urlSession = urlSession
        if restoreSession, let data = Keychain.get(sessionKey), let s = try? JSONDecoder().decode(AuthSession.self, from: data) {
            session = s
        }
    }

    func observeSession(_ handler: @escaping @Sendable (AuthSession?) -> Void) {
        onSessionChange = handler
        handler(session)
    }

    private func setSession(_ s: AuthSession?) {
        session = s
        if let s, let data = try? JSONEncoder().encode(s) { Keychain.set(data, for: sessionKey) } else { Keychain.delete(sessionKey) }
        onSessionChange?(s)
    }

    func signOut() async {
        if let token = session?.accessToken, let base = Config.supabaseURL {
            var req = URLRequest(url: base.appendingPathComponent("auth/v1/logout"))
            req.httpMethod = "POST"
            req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            _ = try? await urlSession.data(for: req)
        }
        setSession(nil)
    }

    // MARK: 인증

    private struct TokenResponse: Decodable {
        struct User: Decodable { let id: String; let email: String? }
        let access_token: String
        let refresh_token: String
        let expires_in: Double?
        let expires_at: Double?
        let user: User?
    }

    private func adopt(_ t: TokenResponse, fallback: AuthSession? = nil) {
        let expires = t.expires_at.map { Date(timeIntervalSince1970: $0) } ?? Date().addingTimeInterval(t.expires_in ?? 3600)
        setSession(AuthSession(accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: expires,
                               userId: t.user?.id ?? fallback?.userId ?? "", email: t.user?.email ?? fallback?.email))
    }

    /// OAuth(PKCE) 가 끝난 뒤 돌려받은 code 를 세션으로 바꾼다
    func exchangeCode(_ code: String, verifier: String) async throws {
        let (data, _) = try await send("POST", path: "auth/v1/token", query: [URLQueryItem(name: "grant_type", value: "pkce")],
                                       body: try JSONEncoder().encode(["auth_code": code, "code_verifier": verifier]), authorized: false)
        adopt(try decode(TokenResponse.self, data))
    }

    private func refresh() async throws {
        guard let current = session else { throw BackendError.notSignedIn }
        do {
            let (data, _) = try await send("POST", path: "auth/v1/token", query: [URLQueryItem(name: "grant_type", value: "refresh_token")],
                                           body: try JSONEncoder().encode(["refresh_token": current.refreshToken]), authorized: false)
            adopt(try decode(TokenResponse.self, data), fallback: current)
        } catch BackendError.http(let code, _) where code == 400 || code == 401 || code == 403 {
            // 갱신 토큰이 만료/폐기됨 → 로그아웃 상태로
            setSession(nil)
            throw BackendError.notSignedIn
        }
    }

    /// 만료 직전이면 미리 갱신해서 유효한 access token 을 돌려준다
    func accessToken() async throws -> String {
        guard let s = session else { throw BackendError.notSignedIn }
        if s.expiresAt.timeIntervalSinceNow < 60 { try await refresh() }
        guard let fresh = session else { throw BackendError.notSignedIn }
        return fresh.accessToken
    }

    // MARK: 전송

    func send(_ method: String, path: String, query: [URLQueryItem] = [], body: Data? = nil,
              headers: [String: String] = [:], authorized: Bool = true, retried: Bool = false) async throws -> (Data, HTTPURLResponse) {
        guard let base = Config.supabaseURL, !Config.supabaseAnonKey.isEmpty else { throw BackendError.notConfigured }
        var comps = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var req = URLRequest(url: comps.url!)
        req.httpMethod = method
        req.httpBody = body
        req.timeoutInterval = 30
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        if body != nil { req.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let token = authorized ? try await accessToken() : Config.supabaseAnonKey
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        headers.forEach { req.setValue($1, forHTTPHeaderField: $0) }

        let (data, response) = try await urlSession.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw BackendError.http(0, "") }
        if http.statusCode == 401, authorized, !retried {
            try await refresh()
            return try await send(method, path: path, query: query, body: body, headers: headers, authorized: authorized, retried: true)
        }
        guard (200..<300).contains(http.statusCode) else {
            throw BackendError.http(http.statusCode, Self.message(from: data))
        }
        return (data, http)
    }

    /// Supabase 오류 본문({message|msg|error_description|error})에서 사람이 읽을 문장만 꺼낸다
    static func message(from data: Data) -> String {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return "" }
        for key in ["message", "msg", "error_description", "error"] {
            if let s = obj[key] as? String, !s.isEmpty { return s }
        }
        return ""
    }

    private func decode<T: Decodable>(_ type: T.Type, _ data: Data) throws -> T {
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw BackendError.decoding(String(describing: error).prefix(160).description) }
    }

    // MARK: PostgREST

    func select<T: Decodable>(_ table: String, select: String = "*", filters: [String: String] = [:],
                              order: String? = nil, limit: Int? = nil) async throws -> [T] {
        var q = [URLQueryItem(name: "select", value: select)]
        q += filters.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        if let order { q.append(URLQueryItem(name: "order", value: order)) }
        if let limit { q.append(URLQueryItem(name: "limit", value: String(limit))) }
        let (data, _) = try await send("GET", path: "rest/v1/\(table)", query: q)
        return try decode([T].self, data)
    }

    @discardableResult
    func insert<T: Decodable>(_ table: String, rows: [[String: JSONValue]], select: String = "*",
                              onConflict: String? = nil, ignoreDuplicates: Bool = false) async throws -> [T] {
        var q = [URLQueryItem(name: "select", value: select)]
        if let onConflict { q.append(URLQueryItem(name: "on_conflict", value: onConflict)) }
        var prefer = "return=representation"
        if onConflict != nil { prefer += ",resolution=\(ignoreDuplicates ? "ignore" : "merge")-duplicates" }
        let (data, _) = try await send("POST", path: "rest/v1/\(table)", query: q,
                                       body: try JSONEncoder().encode(rows), headers: ["Prefer": prefer])
        return try decode([T].self, data)
    }

    func update(_ table: String, filters: [String: String], values: [String: JSONValue]) async throws {
        let q = filters.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        _ = try await send("PATCH", path: "rest/v1/\(table)", query: q, body: try JSONEncoder().encode(values),
                           headers: ["Prefer": "return=minimal"])
    }

    func delete(_ table: String, filters: [String: String]) async throws {
        let q = filters.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        _ = try await send("DELETE", path: "rest/v1/\(table)", query: q, headers: ["Prefer": "return=minimal"])
    }

    func rpc<T: Decodable>(_ function: String, _ params: [String: JSONValue] = [:]) async throws -> T {
        let (data, _) = try await send("POST", path: "rest/v1/rpc/\(function)", body: try JSONEncoder().encode(params))
        return try decode(T.self, data)
    }

    func rpcVoid(_ function: String, _ params: [String: JSONValue] = [:]) async throws {
        _ = try await send("POST", path: "rest/v1/rpc/\(function)", body: try JSONEncoder().encode(params))
    }
}

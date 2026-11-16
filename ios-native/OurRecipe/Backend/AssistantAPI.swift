import Foundation

// 웹의 src/lib/assistant/types.ts 와 같은 JSON 모양.

struct AssistantIdea: Codable, Hashable {
    struct Ingredient: Codable, Hashable { let name: String; let amount: String }
    let title: String
    let emoji: String
    let summary: String
    let ingredients: [Ingredient]
    let instructions: String
    let tags: [String]
}

struct AssistantRecipeCard: Codable, Hashable {
    let id: String
    let title: String
    let emoji: String
    let summary: String
    let ingredients: [String]
    let ownedCount: Int
    let totalCount: Int
}

enum AssistantAction: Hashable, Decodable {
    case addShopping(label: String, items: [String])
    /// mode: "send" 는 그대로 보내고, "fill" 은 입력창에 채워서 사용자가 마무리하게 한다
    case prompt(label: String, prompt: String, mode: String)

    private enum Keys: String, CodingKey { case kind, label, items, prompt, mode }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        let label = try c.decode(String.self, forKey: .label)
        switch try c.decode(String.self, forKey: .kind) {
        case "add_shopping": self = .addShopping(label: label, items: try c.decode([String].self, forKey: .items))
        default: self = .prompt(label: label, prompt: try c.decode(String.self, forKey: .prompt), mode: (try? c.decode(String.self, forKey: .mode)) ?? "send")
        }
    }

    var label: String {
        switch self { case .addShopping(let l, _), .prompt(let l, _, _): return l }
    }
}

struct AssistantReply: Decodable {
    let text: String
    let recipes: [AssistantRecipeCard]
    let ideas: [AssistantIdea]
    let actions: [AssistantAction]
}

struct AssistantUsage: Decodable, Equatable {
    let percent: Double
    let bonusRemaining: Int
    let unlimited: Bool
}

/// 대화 스트림의 한 줄(NDJSON)
enum AssistantEvent {
    case step(Int)
    case result(AssistantReply, AssistantUsage)
    case error(String, limitReached: Bool, usage: AssistantUsage?)

    private struct Raw: Decodable {
        let type: String
        let step: Int?
        let reply: AssistantReply?
        let usage: AssistantUsage?
        let error: String?
        let limitReached: Bool?
    }

    static func parse(_ line: String) -> AssistantEvent? {
        guard let data = line.data(using: .utf8), let raw = try? JSONDecoder().decode(Raw.self, from: data) else { return nil }
        switch raw.type {
        case "step": return raw.step.map(AssistantEvent.step)
        case "result":
            guard let reply = raw.reply, let usage = raw.usage else { return nil }
            return .result(reply, usage)
        case "error": return .error(raw.error ?? "알 수 없는 오류예요.", limitReached: raw.limitReached ?? false, usage: raw.usage)
        default: return nil
        }
    }
}

/// POST {API_BASE_URL}/api/ai/assistant — 웹과 같은 서버 라우트를 Bearer 토큰으로 호출한다
enum AssistantAPI {
    private static func request(householdId: String, body: [String: Any]) async throws -> URLRequest {
        guard let base = Config.apiBaseURL else { throw BackendError.notConfigured }
        var req = URLRequest(url: base.appendingPathComponent("api/ai/assistant"))
        req.httpMethod = "POST"
        req.timeoutInterval = 120   // 링크 분석은 수십 초 걸릴 수 있다
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(try await Backend.shared.accessToken())", forHTTPHeaderField: "Authorization")
        req.setValue(householdId, forHTTPHeaderField: "x-active-household-id")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        return req
    }

    /// 링크면 step 1~3 진행 이벤트가 먼저 오고, 마지막에 result 또는 error 가 온다
    static func chat(messages: [(role: String, text: String)], householdId: String) -> AsyncThrowingStream<AssistantEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    // 앱에서는 새 메뉴를 지어내지 않고, 내가 등록한 레시피 안에서만 추천한다
                    let body: [String: Any] = ["kind": "chat", "messages": messages.map { ["role": $0.role, "text": $0.text] }, "recipesOnly": true]
                    let req = try await request(householdId: householdId, body: body)
                    let (bytes, response) = try await URLSession.shared.bytes(for: req)
                    guard let http = response as? HTTPURLResponse else { throw BackendError.http(0, "") }
                    guard http.statusCode == 200 else {
                        var data = Data()
                        for try await b in bytes { data.append(b) }
                        throw BackendError.http(http.statusCode, Backend.message(from: data))
                    }
                    for try await line in bytes.lines {
                        if let event = AssistantEvent.parse(line) { continuation.yield(event) }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    /// AI 가 제안한 레시피를 우리집 레시피북에 저장한다 → 새 레시피 id
    static func saveIdea(_ idea: AssistantIdea, householdId: String) async throws -> String {
        let ingredients = idea.ingredients.map { ["name": $0.name, "amount": $0.amount] }
        let body: [String: Any] = ["kind": "save_idea", "idea": [
            "title": idea.title, "emoji": idea.emoji, "summary": idea.summary,
            "ingredients": ingredients, "instructions": idea.instructions, "tags": idea.tags,
        ]]
        let (data, response) = try await URLSession.shared.data(for: try await request(householdId: householdId, body: body))
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw BackendError.http((response as? HTTPURLResponse)?.statusCode ?? 0, Backend.message(from: data))
        }
        struct Saved: Decodable { let id: String }
        return try JSONDecoder().decode(Saved.self, from: data).id
    }

    static func addShopping(items: [String], householdId: String) async throws {
        let (data, response) = try await URLSession.shared.data(
            for: try await request(householdId: householdId, body: ["kind": "add_shopping", "items": items]))
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw BackendError.http((response as? HTTPURLResponse)?.statusCode ?? 0, Backend.message(from: data))
        }
    }
}

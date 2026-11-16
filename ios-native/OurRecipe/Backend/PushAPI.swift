import Foundation

/// POST {API_BASE_URL}/api/push/notify — 앱이 Supabase 에 직접 쓴 변경을 가족에게 알린다.
/// 알림이 실패해도 본래 동작(장보기 추가 등)에는 영향이 없도록, 오류는 조용히 무시한다.
enum PushAPI {
    enum Event {
        case shoppingAdded([String])
        case shoppingCompleted(Int)
        case recipeProposed(id: String, title: String, note: String)
        case chatMessage(String)

        var body: [String: Any] {
            switch self {
            case .shoppingAdded(let names): return ["kind": "shopping_added", "names": names]
            case .shoppingCompleted(let count): return ["kind": "shopping_completed", "count": count]
            case .chatMessage(let text): return ["kind": "chat_message", "text": text]
            case .recipeProposed(let id, let title, let note):
                var b: [String: Any] = ["kind": "recipe_proposed", "recipeId": id, "title": title]
                if !note.isEmpty { b["note"] = note }
                return b
            }
        }
    }

    static func notify(_ event: Event, householdId: String) async {
        guard let base = Config.apiBaseURL, let token = try? await Backend.shared.accessToken() else { return }
        var req = URLRequest(url: base.appendingPathComponent("api/push/notify"))
        req.httpMethod = "POST"
        req.timeoutInterval = 20
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(householdId, forHTTPHeaderField: "x-active-household-id")
        req.httpBody = try? JSONSerialization.data(withJSONObject: event.body)
        _ = try? await URLSession.shared.data(for: req)
    }
}

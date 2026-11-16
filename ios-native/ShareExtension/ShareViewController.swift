import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// 유튜브·인스타그램 등에서 "공유 → 우리집 레시피" 를 누르면 앱을 열지 않고 바로 레시피를 만든다.
/// 앱이 키체인에 둔 로그인 세션으로 웹 서버의 AI(/api/ai/assistant)를 호출하고,
/// AI 를 쓸 수 없는 경우(한도 초과·지원하지 않는 링크 등)에는 링크만이라도 레시피북에 저장한다.
final class ShareViewController: UIViewController {
    private let model = ShareModel()

    override func viewDidLoad() {
        super.viewDidLoad()
        let host = UIHostingController(rootView: ShareView(model: model) { [weak self] in self?.close() })
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: view.topAnchor), host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor), host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        host.didMove(toParent: self)
        view.backgroundColor = .clear

        Task { @MainActor in
            await model.run(context: extensionContext)
            if case .done = model.phase { try? await Task.sleep(for: .seconds(0.9)); close() }
        }
    }

    private func close() { extensionContext?.completeRequest(returningItems: nil) }
}

@MainActor
final class ShareModel: ObservableObject {
    enum Phase: Equatable {
        case reading
        case working(String)
        case done(title: String, note: String?)
        case needLogin
        case failed(String)
    }

    @Published var phase: Phase = .reading

    private let steps = ["📹 영상 정보와 조리 과정을 읽고 있어요...", "🥕 재료와 정확한 계량을 정리하는 중이에요...", "🍳 레시피북에 예쁘게 저장 중이에요..."]

    func run(context: NSExtensionContext?) async {
        guard let shared = await Self.extract(from: context) else {
            phase = .failed("공유한 내용에서 링크를 찾지 못했어요.")
            return
        }
        guard Config.isBackendConfigured, await Backend.shared.session != nil else {
            phase = .needLogin
            return
        }
        guard let household = await activeHousehold() else {
            phase = .failed("우리집 정보를 찾지 못했어요. 앱을 한 번 열어 주세요.")
            return
        }

        phase = .working(steps[0])
        var aiNote: String?
        if SharedLink.isAISupported(shared.url) {
            do {
                for try await event in AssistantAPI.chat(messages: [("user", shared.url)], householdId: household) {
                    switch event {
                    case .step(let n): phase = .working(steps[min(max(n, 1), 3) - 1])
                    case .result(let reply, _):
                        if let card = reply.recipes.first { phase = .done(title: card.title, note: nil); return }
                        aiNote = reply.text.isEmpty ? nil : reply.text
                    case .error(let message, let limitReached, _):
                        aiNote = limitReached ? "이번 주 AI 사용 한도에 도달해서 링크만 저장했어요." : message
                    }
                }
            } catch {
                aiNote = "AI 정리에 실패해서 링크만 저장했어요."
            }
        } else {
            aiNote = "AI 정리는 유튜브·인스타그램 링크에서만 돼서 링크만 저장했어요."
        }

        // AI 를 쓸 수 없으면 링크만이라도 레시피북에 남겨 둔다
        do {
            try await saveLinkOnly(shared, household: household)
            phase = .done(title: shared.title ?? SharedLink.host(of: shared.url) ?? "링크", note: aiNote)
        } catch {
            phase = .failed("저장하지 못했어요. 잠시 후 다시 시도해주세요.")
        }
    }

    private func activeHousehold() async -> String? {
        if let data = Keychain.get(SharedKeys.activeHousehold), let id = String(data: data, encoding: .utf8), !id.isEmpty { return id }
        // 앱이 아직 한 번도 안 열렸다면 내 우리집 중 첫 번째
        struct Row: Decodable { let household_id: String }
        guard let uid = await Backend.shared.session?.userId,
              let rows: [Row] = try? await Backend.shared.select("household_members", select: "household_id",
                                                                 filters: ["user_id": "eq.\(uid)"], order: "joined_at.asc", limit: 1) else { return nil }
        return rows.first?.household_id
    }

    /// 앱의 "링크만 저장"과 같은 모양 (recipes + bookmarks). 새 레시피가 목록 맨 위에 오도록 position 을 아주 작게 둔다
    private func saveLinkOnly(_ shared: (url: String, title: String?), household: String) async throws {
        guard let uid = await Backend.shared.session?.userId else { throw BackendError.notSignedIn }
        let id = UUID().uuidString.lowercased()
        struct Row: Decodable { let id: String }
        _ = try await Backend.shared.insert("recipes", rows: [[
            "id": .string(id), "household_id": .string(household), "title": .null, "tags": .array([]),
            "hide_ingredients": .bool(false), "is_favorite": .bool(false), "created_by": .string(uid),
            "position": .int(-Int(Date().timeIntervalSince1970)),
        ]], select: "id") as [Row]
        do {
            _ = try await Backend.shared.insert("bookmarks", rows: [[
                "household_id": .string(household), "recipe_id": .string(id), "created_by": .string(uid),
                "url": .string(shared.url), "title": shared.title.json, "domain": SharedLink.host(of: shared.url).json,
                "thumbnail_url": SharedLink.thumbnailURL(for: shared.url).json,
            ]], select: "id") as [Row]
        } catch {
            try? await Backend.shared.delete("recipes", filters: ["id": "eq.\(id)"])   // 링크 없이 빈 레시피만 남지 않게
            throw error
        }
    }

    // MARK: 공유받은 내용에서 링크 꺼내기

    private static func extract(from context: NSExtensionContext?) async -> (url: String, title: String?)? {
        let items = (context?.inputItems as? [NSExtensionItem]) ?? []
        for item in items {
            let title = (item.attributedTitle?.string ?? item.attributedContentText?.string).flatMap { SharedLink.firstURL(in: $0) == nil ? $0 : nil }
            for provider in item.attachments ?? [] {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier),
                   let value = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier),
                   let url = (value as? URL)?.absoluteString, url.hasPrefix("http") {
                    return (url, title)
                }
                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier),
                   let value = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier),
                   let text = value as? String, let url = SharedLink.firstURL(in: text) {
                    return (url, title ?? text.replacingOccurrences(of: url, with: "").trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty)
                }
            }
            if let text = item.attributedContentText?.string, let url = SharedLink.firstURL(in: text) { return (url, title) }
        }
        return nil
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}

struct ShareView: View {
    @ObservedObject var model: ShareModel
    let close: () -> Void

    private let accent = Color(red: 0.91, green: 0.376, blue: 0.235)

    var body: some View {
        ZStack {
            Color.black.opacity(0.25).ignoresSafeArea().onTapGesture { if canClose { close() } }
            VStack(spacing: 14) {
                content
                if canClose {
                    Button(action: close) {
                        Text(model.phase == .needLogin ? "확인" : "닫기").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 13).background(accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
            }
            .padding(22).frame(maxWidth: 320)
            .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
    }

    private var canClose: Bool {
        switch model.phase { case .needLogin, .failed: return true; default: return false }
    }

    @ViewBuilder
    private var content: some View {
        switch model.phase {
        case .reading, .working:
            ProgressView().controlSize(.large).padding(.top, 6)
            Text(workingText).font(.system(size: 15, weight: .semibold)).multilineTextAlignment(.center)
        case .done(let title, let note):
            Image(systemName: "checkmark.circle.fill").font(.system(size: 40)).foregroundStyle(accent)
            Text("레시피북에 저장했어요!").font(.system(size: 17, weight: .bold))
            Text(title).font(.system(size: 14)).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.center)
            if let note { Text(note).font(.system(size: 12.5)).foregroundStyle(.secondary).multilineTextAlignment(.center) }
        case .needLogin:
            Image(systemName: "person.crop.circle.badge.exclamationmark").font(.system(size: 36)).foregroundStyle(accent)
            Text("로그인이 필요해요").font(.system(size: 17, weight: .bold))
            Text("우리집 레시피 앱을 열어 로그인한 뒤 다시 공유해 주세요.").font(.system(size: 13.5)).foregroundStyle(.secondary).multilineTextAlignment(.center)
        case .failed(let message):
            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 36)).foregroundStyle(accent)
            Text(message).font(.system(size: 14.5, weight: .semibold)).multilineTextAlignment(.center)
        }
    }

    private var workingText: String {
        if case .working(let t) = model.phase { return t }
        return "링크를 읽고 있어요..."
    }
}

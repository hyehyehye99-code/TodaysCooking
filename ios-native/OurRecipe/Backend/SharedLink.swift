import Foundation

/// 앱과 공유 확장이 함께 쓰는 키체인 키
enum SharedKeys {
    /// 앱이 지금 쓰는 우리집 id (확장이 어느 우리집에 저장할지 알기 위해)
    static let activeHousehold = "activeHouseholdId"
}

/// 공유 시트로 받은 글에서 링크를 꺼낸다 (유튜브는 URL 로, 인스타그램은 "문구 + URL" 글로 오는 경우가 많다)
enum SharedLink {
    static func firstURL(in text: String) -> String? {
        guard let range = text.range(of: #"https?://[^\s<>"']+"#, options: .regularExpression) else { return nil }
        var url = String(text[range])
        while let last = url.last, ".,;:!?)]}」』”’".contains(last) { url.removeLast() }
        return url
    }

    /// 링크의 대표 이미지 주소. 유튜브는 영상 id 만으로 만들 수 있다 (인스타그램 등은 서버가 가져올 때까지 없음)
    static func thumbnailURL(for url: String) -> String? {
        guard let u = URL(string: url), let h = u.host?.lowercased() else { return nil }
        var id: String?
        if h == "youtu.be" { id = u.pathComponents.dropFirst().first }
        else if h == "youtube.com" || h.hasSuffix(".youtube.com") {
            if u.path.hasPrefix("/shorts/") || u.path.hasPrefix("/embed/") || u.path.hasPrefix("/live/") { id = u.pathComponents.dropFirst(2).first }
            else { id = URLComponents(url: u, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "v" }?.value }
        }
        guard let id, !id.isEmpty else { return nil }
        return "https://i.ytimg.com/vi/\(id)/hqdefault.jpg"
    }

    static func host(of url: String) -> String? {
        URL(string: url)?.host?.replacingOccurrences(of: "www.", with: "")
    }

    /// AI 자동 정리가 지원되는 링크인지 (웹과 같은 기준: 유튜브·인스타그램)
    static func isAISupported(_ url: String) -> Bool {
        guard let h = host(of: url)?.lowercased() else { return false }
        // "notyoutube.com" 같은 비슷한 도메인이 통과하지 않도록, 도메인 자체이거나 그 하위 도메인일 때만 인정한다
        func matches(_ domain: String) -> Bool { h == domain || h.hasSuffix("." + domain) }
        return matches("youtube.com") || matches("youtu.be") || matches("instagram.com")
    }
}

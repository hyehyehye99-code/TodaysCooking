import Foundation

/// 빌드 설정(Config/*.xcconfig → Info.plist)에서 읽는 서버 주소와 키.
/// 값이 없으면 앱은 게스트(로컬) 모드로만 동작한다.
enum Config {
    private static func string(_ key: String) -> String {
        (Bundle.main.object(forInfoDictionaryKey: key) as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    private static func url(_ key: String) -> URL? {
        let s = string(key)
        guard !s.isEmpty, !s.contains("YOUR-"), let u = URL(string: s), u.host != nil else { return nil }
        return u
    }

    static var supabaseURL: URL? { url("SupabaseURL") }
    /// 공개 anon key (웹 브라우저에도 내려가는 값). service role key 는 앱에 절대 넣지 않는다.
    static var supabaseAnonKey: String {
        let k = string("SupabaseAnonKey")
        return k.contains("YOUR-") ? "" : k
    }
    /// AI(/api/ai/assistant) · 쿠팡 구매하기 리다이렉트가 있는 웹 서버
    static var apiBaseURL: URL? { url("ApiBaseURL") }

    static var isBackendConfigured: Bool { supabaseURL != nil && !supabaseAnonKey.isEmpty }

    /// 기존 Capacitor 앱과 같은 스킴 · 같은 리다이렉트 (Supabase 허용 목록에 이미 등록돼 있다)
    static let authScheme = "com.hyeji.ourmenu"
    static let authRedirect = "com.hyeji.ourmenu://auth/callback"
}

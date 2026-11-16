import AuthenticationServices
import CryptoKit
import UIKit

/// OAuth 2.0 PKCE (Supabase 가 지원하는 code flow). 기존 웹/Capacitor 앱의 로그인과 같은 방식이다.
enum PKCE {
    static func makeVerifier() -> String {
        var bytes = [UInt8](repeating: 0, count: 48)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes).base64URLEncoded
    }

    static func challenge(for verifier: String) -> String {
        Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncoded
    }
}

extension Data {
    var base64URLEncoded: String {
        base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}

@Observable
@MainActor
final class AuthManager: NSObject, ASWebAuthenticationPresentationContextProviding {
    enum Provider: String, CaseIterable, Identifiable {
        case google, apple, kakao
        var id: String { rawValue }
        var label: String {
            switch self {
            case .google: return "구글로 시작하기"
            case .apple: return "Apple로 시작하기"
            case .kakao: return "카카오톡으로 시작하기"
            }
        }
    }

    private(set) var session: AuthSession?
    private(set) var isWorking = false
    var errorMessage: String?
    private var webSession: ASWebAuthenticationSession?

    var isSignedIn: Bool { session != nil }
    /// 서버 설정이 없으면 로그인 버튼 자체를 숨긴다 (게스트 모드만)
    var isAvailable: Bool { Config.isBackendConfigured }

    override init() {
        super.init()
        Task { [weak self] in
            await Backend.shared.observeSession { s in Task { @MainActor in self?.session = s } }
        }
    }

    func signIn(_ provider: Provider) async {
        guard let base = Config.supabaseURL, Config.isBackendConfigured else {
            errorMessage = BackendError.notConfigured.localizedDescription
            return
        }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        let verifier = PKCE.makeVerifier()
        var comps = URLComponents(url: base.appendingPathComponent("auth/v1/authorize"), resolvingAgainstBaseURL: false)!
        comps.queryItems = [
            URLQueryItem(name: "provider", value: provider.rawValue),
            URLQueryItem(name: "redirect_to", value: Config.authRedirect),
            URLQueryItem(name: "code_challenge", value: PKCE.challenge(for: verifier)),
            URLQueryItem(name: "code_challenge_method", value: "s256"),
        ]

        do {
            let callback = try await authenticate(url: comps.url!)
            let items = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems ?? []
            guard let code = items.first(where: { $0.name == "code" })?.value else {
                let reason = items.first(where: { $0.name == "error_description" })?.value
                throw BackendError.http(0, reason ?? "로그인을 완료하지 못했어요.")
            }
            try await Backend.shared.exchangeCode(code, verifier: verifier)
        } catch let error as ASWebAuthenticationSessionError where error.code == .canceledLogin {
            // 사용자가 직접 닫은 것은 오류로 보여 주지 않는다
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        await Backend.shared.signOut()
    }

    private func authenticate(url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let s = ASWebAuthenticationSession(url: url, callbackURLScheme: Config.authScheme) { callback, error in
                if let callback { continuation.resume(returning: callback) }
                else { continuation.resume(throwing: error ?? BackendError.http(0, "로그인을 완료하지 못했어요.")) }
            }
            s.presentationContextProvider = self
            s.prefersEphemeralWebBrowserSession = false
            webSession = s
            s.start()
        }
    }

    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow) ?? ASPresentationAnchor()
        }
    }
}

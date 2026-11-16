import FirebaseCore
import FirebaseMessaging
import SwiftUI
import UserNotifications

/// 푸시(FCM) 등록 · 해제 · 알림 탭 이동.
/// 알림을 *보내는* 일은 웹 서버가 하고(/api/push/notify), 앱은 기기 토큰을 서버(fcm_tokens)에 등록만 한다.
@MainActor
final class PushManager {
    static let shared = PushManager()

    weak var store: Store? {
        didSet { if store != nil, let path = pendingPath { pendingPath = nil; store?.routeNotification(path) } }
    }
    private(set) var fcmToken: String?
    private var pendingPath: String?
    private let enabledKey = "pushEnabled"

    /// 사용자가 알림을 켜 둔 상태인지 (기본 켜짐). iOS 권한과는 별개로 "이 기기에서 우리집 알림 받기" 설정이다
    var isEnabled: Bool { UserDefaults.standard.object(forKey: enabledKey) as? Bool ?? true }

    // MARK: 켜기 / 끄기

    /// 로그인한 직후/앱 시작 때: 처음이면 iOS 알림 권한을 묻고, 이미 허용돼 있으면 토큰을 새로 받아 서버에 맞춘다
    func onSignedIn() async {
        guard isEnabled else { return }
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .notDetermined: _ = await requestAndRegister()
        case .authorized, .provisional, .ephemeral: UIApplication.shared.registerForRemoteNotifications()
        default: break
        }
        await syncToken()
    }

    /// 설정의 "알림" 스위치를 켤 때. 권한이 거부돼 있으면 false (설정 앱에서 허용해야 한다)
    func enable() async -> Bool {
        UserDefaults.standard.set(true, forKey: enabledKey)
        let status = await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
        if status == .denied { return false }
        let ok = status == .notDetermined ? await requestAndRegister() : true
        if ok { UIApplication.shared.registerForRemoteNotifications(); await syncToken() }
        return ok
    }

    func disable() async {
        UserDefaults.standard.set(false, forKey: enabledKey)
        await unregisterToken()
    }

    private func requestAndRegister() async -> Bool {
        let granted = (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])) ?? false
        if granted { UIApplication.shared.registerForRemoteNotifications() }
        return granted
    }

    // MARK: 토큰 ↔ 서버

    func tokenUpdated(_ token: String?) {
        fcmToken = token
        Task { await syncToken() }
    }

    /// 이 기기의 토큰을 "지금 우리집"에 연결해 서버에 저장한다 (웹의 saveFcmToken 과 같다: 토큰 하나는 우리집 하나)
    func syncToken() async {
        guard isEnabled, let token = fcmToken, let store, store.isRemote,
              let household = store.currentHouseholdId, let user = store.userId else { return }
        _ = try? await Backend.shared.insert("fcm_tokens", rows: [["user_id": .string(user), "household_id": .string(household), "token": .string(token)]],
                                              select: "id", onConflict: "token") as [RemoteIdRow]
    }

    /// 로그아웃/탈퇴/알림 끄기: 서버에서 이 기기 토큰을 지워 더 이상 알림이 오지 않게 한다
    func unregisterToken() async {
        guard let token = fcmToken else { return }
        try? await Backend.shared.delete("fcm_tokens", filters: ["token": "eq.\(token)"])
    }

    // MARK: 알림 탭

    /// 알림 payload 의 url("/shopping", "/mypage/fridge", "/recipes/<id>")로 화면을 연다
    func route(_ path: String) {
        guard let store else { pendingPath = path; return }   // 앱이 막 켜지는 중이면 Store 가 준비된 뒤에 처리
        store.routeNotification(path)
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if FirebaseApp.app() == nil { FirebaseApp.configure() }
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    nonisolated func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        Task { @MainActor in PushManager.shared.tokenUpdated(fcmToken) }
    }

    /// 앱이 열려 있을 때도 알림 배너를 보여 준다 (냉장고 정리 알림 미리보기 포함)
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let path = response.notification.request.content.userInfo["url"] as? String
        await MainActor.run {
            if let path { PushManager.shared.route(path) } else { PushManager.shared.route("/") }
        }
    }
}

import UserNotifications

enum CleanupFrequency: String, CaseIterable, Identifiable {
    case weekly = "매주 일요일"
    case monthly = "매월 1일"
    var id: String { rawValue }
}

/// 냉장고 정리 알림 (기기 안에서만 울리는 로컬 알림)
enum Reminders {
    private static let id = "fridge-cleanup"
    private static let previewId = "fridge-cleanup-preview"

    private static func content() -> UNMutableNotificationContent {
        let c = UNMutableNotificationContent()
        c.title = "냉장고 정리할 시간이에요 🧊"
        c.body = "유통기한이 임박한 재료가 있는지 확인해볼까요?"
        c.sound = .default
        return c
    }

    /// 권한을 요청하고 반복 알림을 예약한다. 권한이 없으면 false
    static func enable(_ freq: CleanupFrequency) async -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        guard granted else { return false }
        center.removePendingNotificationRequests(withIdentifiers: [id])
        var when = DateComponents()
        when.hour = 19
        when.minute = 0
        switch freq {
        case .weekly: when.weekday = 1   // 일요일
        case .monthly: when.day = 1
        }
        let trigger = UNCalendarNotificationTrigger(dateMatching: when, repeats: true)
        try? await center.add(UNNotificationRequest(identifier: id, content: content(), trigger: trigger))
        return true
    }

    static func disable() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id, previewId])
    }

    /// 5초 뒤에 알림이 어떻게 오는지 미리 받아보기
    static func preview() async {
        let center = UNUserNotificationCenter.current()
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        try? await center.add(UNNotificationRequest(identifier: previewId, content: content(), trigger: trigger))
    }
}

/// 앱이 열려 있을 때도 알림 배너를 보여 준다 (미리 받아보기용)
final class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationDelegate()
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }
}

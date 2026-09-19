import Foundation
import ActivityKit

// Shared between the App target (starts/ends activities) and
// TimerWidgetExtension (renders them) — added to both target memberships.
@available(iOS 16.2, *)
struct TimerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endDate: Date
        var isPaused: Bool
    }

    var name: String
    var iconEmoji: String
}

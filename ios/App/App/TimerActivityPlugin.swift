import Foundation
import Capacitor
import ActivityKit

// Bridges the JS timer actions (start/pause/resume/reset/delete/complete) to
// a Dynamic Island / Lock Screen Live Activity. Kept as a thin start/end
// surface — a running countdown renders itself natively via
// `Text(timerInterval:)` in TimerWidgetLiveActivity, so there's no need to
// push per-second updates from JS the way the in-app UI does.
@objc(TimerActivityPlugin)
public class TimerActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TimerActivityPlugin"
    public let jsName = "TimerActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endAll", returnType: CAPPluginReturnPromise),
    ]

    // Stored as Any (not Activity<TimerActivityAttributes>) so this property
    // declaration doesn't itself require iOS 16.2 availability — only the
    // guarded method bodies below ever cast it back.
    private var activitiesById: [String: Any] = [:]

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve()
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve()
            return
        }

        let id = call.getString("id") ?? ""
        let name = call.getString("name") ?? ""
        let iconEmoji = call.getString("iconEmoji") ?? ""
        let endEpochMs = call.getDouble("endEpochMs") ?? 0
        let isPaused = call.getBool("isPaused") ?? false
        let endDate = Date(timeIntervalSince1970: endEpochMs / 1000)

        // ActivityKit has no "restart with new attributes" call, only content
        // state updates — ending whatever's already running for this timer
        // id first keeps a restart (or a name/icon change) from leaving a
        // stale duplicate activity behind.
        if let existing = activitiesById[id] as? Activity<TimerActivityAttributes> {
            Task { await existing.end(nil, dismissalPolicy: .immediate) }
        }

        let attributes = TimerActivityAttributes(name: name, iconEmoji: iconEmoji)
        let state = TimerActivityAttributes.ContentState(endDate: endDate, isPaused: isPaused)

        do {
            let activity = try Activity<TimerActivityAttributes>.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil)
            )
            activitiesById[id] = activity
        } catch {
            // No Live Activity — the in-app UI and local notification alarm
            // still work regardless.
        }
        call.resolve()
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve()
            return
        }
        let id = call.getString("id") ?? ""
        if let activity = activitiesById[id] as? Activity<TimerActivityAttributes> {
            Task { await activity.end(nil, dismissalPolicy: .immediate) }
            activitiesById.removeValue(forKey: id)
        }
        call.resolve()
    }

    @objc func endAll(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve()
            return
        }
        Task {
            for activity in Activity<TimerActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        activitiesById.removeAll()
        call.resolve()
    }
}

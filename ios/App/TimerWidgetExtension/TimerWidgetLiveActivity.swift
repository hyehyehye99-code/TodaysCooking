import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.2, *)
struct TimerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            HStack(spacing: 12) {
                Text(context.attributes.iconEmoji.isEmpty ? "⏱️" : context.attributes.iconEmoji)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.name)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    if context.state.isPaused {
                        Text("일시정지됨")
                            .font(.title3.bold())
                    } else {
                        Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                            .font(.title3.bold())
                            .monospacedDigit()
                    }
                }
                Spacer()
            }
            .padding()
            .activityBackgroundTint(.white)
            .activitySystemActionForegroundColor(.black)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.iconEmoji.isEmpty ? "⏱️" : context.attributes.iconEmoji)
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isPaused {
                        Text("일시정지")
                    } else {
                        Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                            .monospacedDigit()
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.name)
                        .font(.caption)
                        .lineLimit(1)
                }
            } compactLeading: {
                Text(context.attributes.iconEmoji.isEmpty ? "⏱️" : context.attributes.iconEmoji)
            } compactTrailing: {
                if context.state.isPaused {
                    Image(systemName: "pause.fill")
                } else {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .monospacedDigit()
                        .frame(width: 44)
                }
            } minimal: {
                Text(context.attributes.iconEmoji.isEmpty ? "⏱️" : context.attributes.iconEmoji)
            }
        }
    }
}

import SwiftUI

// MARK: - 마스코트 (브랜드 PNG)

struct MascotImage: View {
    let name: String
    var size: CGFloat = 48
    var breathing = false
    @State private var on = false

    var body: some View {
        Image(name).resizable().scaledToFit().frame(width: size, height: size)
            .scaleEffect(x: on ? 1.035 : 1, y: on ? 0.97 : 1, anchor: .bottom)
            .animation(breathing ? .easeInOut(duration: 1.9).repeatForever(autoreverses: true) : nil, value: on)
            .onAppear { if breathing { on = true } }
            .accessibilityHidden(true)
    }
}

/// 비서 말풍선 옆 동그란 아바타
struct Avatar: View {
    let name: String
    var size: CGFloat = 34
    var body: some View {
        Circle().fill(Theme.card)
            .overlay(Circle().strokeBorder(Theme.border, lineWidth: 1))
            .overlay(MascotImage(name: name, size: size * 0.78).offset(y: size * 0.03))
            .frame(width: size, height: size)
    }
}

// MARK: - 인라인 카드

struct TableRow: Identifiable {
    let id = UUID()
    let name: String
    let amt: String
    var lack = false
}

struct CardAction: Identifiable {
    enum Kind { case normal, primary, danger }
    let id = UUID()
    let label: String
    var kind: Kind = .normal
    var disabled = false
    let run: () -> Void
}

struct InlineCard<Extra: View>: View {
    var icon: String? = nil
    let title: String
    var sub: String? = nil
    var thumb: (tint: Color, photo: String)? = nil
    var meta: [(String, String)] = []
    var table: [TableRow] = []
    var actions: [CardAction] = []
    @ViewBuilder var extra: () -> Extra

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center, spacing: 10) {
                if let icon { Image(icon).resizable().scaledToFit().frame(width: 28, height: 28) }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.suit(16, .bold)).foregroundStyle(Theme.ink)
                    if let sub { Text(sub).font(.suit(12.5)).foregroundStyle(Theme.sub) }
                }
            }
            if let thumb {
                RoundedRectangle(cornerRadius: 14, style: .continuous).fill(thumb.tint).frame(height: 118)
                    .overlay(Image(thumb.photo).resizable().scaledToFit().frame(height: 92))
            }
            if !meta.isEmpty {
                VStack(spacing: 7) {
                    ForEach(meta, id: \.0) { label, value in
                        HStack(alignment: .top) {
                            Text(label).foregroundStyle(Theme.sub)
                            Spacer(minLength: 12)
                            Text(value).font(.suit(13.5, .semibold)).foregroundStyle(Theme.ink).multilineTextAlignment(.trailing)
                        }
                        .font(.suit(13.5))
                    }
                }
            }
            if !table.isEmpty { ReceiptTable(rows: table) }
            extra()
            if !actions.isEmpty {
                HStack(spacing: 8) {
                    ForEach(actions.prefix(3)) { a in
                        Button(action: a.run) {
                            Text(a.label)
                                .font(.suit(13.5, .bold))
                                .lineLimit(1).minimumScaleFactor(0.8)
                                .frame(maxWidth: .infinity).padding(.vertical, 12)
                                .foregroundStyle(fg(a))
                                .background(bg(a), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(PressStyle())
                        .disabled(a.disabled)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .paperCard()
    }

    private func fg(_ a: CardAction) -> Color {
        if a.disabled { return Theme.faint }
        switch a.kind { case .primary: return .white; case .danger: return Theme.warn; case .normal: return Theme.ink }
    }
    private func bg(_ a: CardAction) -> Color {
        if a.disabled { return Theme.surface }
        return a.kind == .primary ? Theme.accent : Theme.surface
    }
}

extension InlineCard where Extra == EmptyView {
    init(icon: String? = nil, title: String, sub: String? = nil, thumb: (tint: Color, photo: String)? = nil,
         meta: [(String, String)] = [], table: [TableRow] = [], actions: [CardAction] = []) {
        self.init(icon: icon, title: title, sub: sub, thumb: thumb, meta: meta, table: table, actions: actions) { EmptyView() }
    }
}

/// 영수증 스타일 2열 표 (좌 재료명 / 우 계량 우측 정렬)
struct ReceiptTable: View {
    let rows: [TableRow]
    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.element.id) { i, r in
                HStack(spacing: 6) {
                    Text(r.name).font(.suit(14, r.lack ? .bold : .medium)).foregroundStyle(Theme.ink)
                    if r.lack {
                        Text("부족").font(.suit(11, .bold)).foregroundStyle(Theme.accent)
                            .padding(.horizontal, 6).padding(.vertical, 1.5)
                            .background(Theme.accentSoft, in: Capsule())
                    }
                    Spacer(minLength: 12)
                    Text(r.amt).font(.suit(14)).foregroundStyle(Theme.sub).monospacedDigit()
                }
                .padding(.vertical, 10)
                if i < rows.count - 1 { DashedLine() }
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 2)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct DashedLine: View {
    var body: some View {
        Line().stroke(Color(hex: 0xDADDE2), style: StrokeStyle(lineWidth: 1, dash: [3, 3])).frame(height: 1)
    }
    private struct Line: Shape {
        func path(in r: CGRect) -> Path {
            var p = Path(); p.move(to: CGPoint(x: 0, y: r.midY)); p.addLine(to: CGPoint(x: r.maxX, y: r.midY)); return p
        }
    }
}

// MARK: - 칩 (선택 시 주황 채움)

struct Chip: View {
    let label: String
    var on = false
    var icon: String? = nil
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                if let icon { Image(icon).resizable().scaledToFit().frame(width: 20, height: 20) }
                Text(label).font(.suit(13.5, .semibold)).lineLimit(1)
            }
            .padding(.horizontal, 13).padding(.vertical, 8)
            .foregroundStyle(on ? .white : Theme.ink)
            .background(on ? Theme.accent : Theme.surface, in: Capsule())
        }
        .buttonStyle(PressStyle())
    }
}

// MARK: - 카운트다운 타이머 카드

struct TimerCard: View {
    let label: String
    let sec: Int
    var onDone: (String) -> Void

    @State private var left: Int
    @State private var total: Int
    @State private var running = true
    @State private var cancelled = false

    init(label: String, sec: Int, onDone: @escaping (String) -> Void) {
        self.label = label; self.sec = sec; self.onDone = onDone
        _left = State(initialValue: sec); _total = State(initialValue: sec)
    }

    private var done: Bool { left <= 0 }

    var body: some View {
        if cancelled {
            Text("\(label) 타이머를 취소했어요").font(.suit(13)).foregroundStyle(Theme.sub)
        } else {
            InlineCard(
                icon: "tool-timer", title: done ? "다 됐어요!" : label,
                sub: done ? label : running ? "남은 시간" : "잠시 멈춤",
                actions: done
                    ? [CardAction(label: "확인", kind: .primary) { cancelled = true }]
                    : [CardAction(label: running ? "일시정지" : "계속") { running.toggle() },
                       CardAction(label: "+1분") { left += 60; total += 60 },
                       CardAction(label: "취소", kind: .danger) { cancelled = true }]
            ) {
                VStack(spacing: 12) {
                    Text(done ? "삑삑삑!" : clockText(left))
                        .font(.suit(done ? 26 : 42, .heavy)).foregroundStyle(done ? Theme.accent : Theme.ink).monospacedDigit()
                        .frame(maxWidth: .infinity)
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Theme.surface)
                            Capsule().fill(Theme.accent)
                                .frame(width: g.size.width * CGFloat(total - max(left, 0)) / CGFloat(max(total, 1)))
                                .animation(.linear(duration: 1), value: left)
                        }
                    }
                    .frame(height: 6)
                }
            }
            .task(id: running) {
                guard running else { return }
                while !Task.isCancelled, left > 0 {
                    try? await Task.sleep(for: .seconds(1))
                    if Task.isCancelled { return }
                    left -= 1
                    if left <= 0 {
                        running = false
                        onDone(label)
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                    }
                }
            }
        }
    }
}

import SwiftUI
import UIKit

/// 대화 속 인라인 카드를 종류별로 그려 주는 뷰
struct ChatCard: View {
    @Environment(Store.self) private var store
    let kind: CardKind

    var body: some View {
        switch kind {
        case let .timer(label, sec):
            TimerCard(label: label, sec: sec) { store.showToast("\($0) 타이머가 끝났어요") }

        case let .recipe(id):
            if let r = store.recipe(id) {
                let lack = store.missing(r).count
                InlineCard(
                    icon: "tool-recipebook", title: r.displayTitle, sub: r.sub, thumb: (r.tint, r.photo), thumbURL: r.photoURL,
                    meta: [("소요시간", r.time), ("분량", r.serving), ("부족한 재료", lack > 0 ? "\(lack)개" : "없음")],
                    actions: [
                        CardAction(label: "자세히") { store.openRecipe(r.id) },
                        CardAction(label: "장보기 담기") { store.addMissing(r) },
                        r.saved
                            ? CardAction(label: "저장됨", disabled: true) {}
                            : CardAction(label: "저장", kind: .primary) { store.save(r.id) },
                    ])
            }

        case let .ings(id):
            if let r = store.recipe(id) {
                InlineCard(
                    icon: "tool-cuttingboard", title: "\(r.title) 재료", sub: "\(r.serving) 기준",
                    table: r.ings.map { TableRow(name: $0.name, amt: $0.amt, lack: !store.inFridge($0.name)) },
                    actions: [
                        CardAction(label: "부족한 재료 담기", kind: .primary) { store.addMissing(r) },
                        CardAction(label: "자세히") { store.openRecipe(r.id) },
                    ])
            }

        case .fridge:
            let soon = store.fridge.filter { $0.days != nil }.sorted { ($0.days ?? 0) < ($1.days ?? 0) }.prefix(2)
            let picks = store.savedRecipes
                .filter { r in r.ings.contains { i in soon.contains { $0.name == i.name } } }
                .prefix(2)
            InlineCard(
                icon: "tool-fridge", title: "냉장고로 메뉴 추천", sub: "유통기한 임박 재료부터 골랐어요",
                meta: soon.map { ($0.name, $0.ddayText ?? "") },
                table: picks.map { r in
                    let n = store.missing(r).count
                    return TableRow(name: r.title, amt: n > 0 ? "부족 \(n)개" : "바로 가능")
                },
                actions: picks.map { r in CardAction(label: r.title) { store.openRecipe(r.id) } }
                    + [CardAction(label: "냉장고 수정") { store.showFridge = true }])

        case .idea(let idea):
            let saved = store.savedIdeas.contains(idea)
            InlineCard(
                icon: "tool-recipebook", title: "\(idea.emoji) \(idea.title)", sub: idea.summary,
                table: idea.ingredients.map { TableRow(name: $0.name, amt: $0.amount) },
                actions: [saved ? CardAction(label: "저장됨", disabled: true) {} : CardAction(label: "레시피북에 저장", kind: .primary) { store.saveIdea(idea) }])

        case .shop:
            let open = store.shop.filter { !$0.checked }
            InlineCard(
                icon: "shopping-basket", title: "장보기 목록", sub: open.isEmpty ? "다 담았어요" : "아직 \(open.count)개 남았어요",
                table: open.prefix(5).map { TableRow(name: $0.name, amt: $0.amt) },
                actions: [CardAction(label: "장보기 열기", kind: .primary) { store.tab = .shop }])
        }
    }
}

/// 같은 주방 메이트의 동그란 프로필 (이름 첫 글자)
struct MateAvatar: View {
    @Environment(Store.self) private var store
    let name: String
    var size: CGFloat = 32
    var body: some View {
        ProfileIconView(icon: store.members.first { $0.name == name }?.icon, name: name, size: size)
    }
}

struct ChatView: View {
    @Environment(Store.self) private var store
    @State private var input = ""
    @State private var hint: String?
    /// "링크로 레시피 등록"을 눌렀을 때만 true: 다음에 보내는 말은 가족이 아니라 AI 셰프가 처리한다
    @State private var linkMode = false
    @State private var askReset = false
    @State private var clipHasLink = false
    /// X 로 닫은 클립보드(내용이 바뀌기 전까지 다시 띄우지 않는다)
    @AppStorage("clipDismissedCount") private var clipDismissedCount = -1
    @Environment(\.scenePhase) private var scenePhase
    @FocusState private var focused: Bool

    private let green = Color(hex: 0x34C38F)

    var body: some View {
        VStack(spacing: 0) {
            header
            if store.msgs.isEmpty && !store.typing { welcome } else { timeline }
        }
        .background(Color.white.ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) { composer }
        .task { refreshClipboard() }
        // 가족이 보낸 메시지를 몇 초마다 가져온다 (이 화면이 열려 있는 동안만)
        .task {
            while !Task.isCancelled {
                await store.pollMessages()
                try? await Task.sleep(for: .seconds(8))
            }
        }
        .onChange(of: store.draft) { _, v in if let v { input = v; store.draft = nil; focused = true } }
        .onChange(of: scenePhase) { _, phase in if phase == .active { refreshClipboard() } }
        #if DEBUG
        .task { if UserDefaults.standard.bool(forKey: "askreset") { try? await Task.sleep(for: .seconds(2)); askReset = true } }
        #endif
        // 화면 가운데에 뜨는 알림 창 (확인 창은 입력창 쪽에 팝오버로 붙어서 위치가 어색했다)
        .alert("대화를 초기화할까요?", isPresented: $askReset) {
            Button("취소", role: .cancel) {}
            Button("초기화", role: .destructive) { withAnimation { store.resetChat() } }
        } message: {
            Text("저장한 레시피와 냉장고는 그대로 남아요.")
        }
    }

    // MARK: 헤더 — "영공이네 AI 셰프" + 주방에서 대기 중. 이름을 누르면 주방 설정이 열린다

    private var header: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Button { store.showKitchenSettings = true } label: {
                    HStack(spacing: 12) {
                        ZStack(alignment: .bottomTrailing) {
                            Avatar(name: "chef-greeting", size: 44)
                            if let other = store.members.first(where: { !$0.isMe }) {
                                MateAvatar(name: other.name, size: 22)
                                    .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                                    .offset(x: 5, y: 3)
                            }
                        }
                        .frame(width: 48, height: 46, alignment: .topLeading)
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 4) {
                                Text(store.kitchenTitle).font(.suit(17, .bold)).foregroundStyle(Theme.ink).lineLimit(1)
                                Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.faint)
                            }
                            HStack(spacing: 5) {
                                Circle().fill(green).frame(width: 6, height: 6)
                                Text("\(store.chefName)와 가족 \(max(store.members.count, 1))명").font(.suit(12.5)).foregroundStyle(Theme.sub).lineLimit(1)
                            }
                        }
                    }
                }
                .buttonStyle(PressStyle())
                Spacer(minLength: 4)

                // 대화가 시작되면 나타나는 초기화 버튼
                if !store.msgs.isEmpty {
                    Button { askReset = true } label: {
                        Image(systemName: "arrow.counterclockwise").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.sub)
                            .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
                    }
                    .buttonStyle(PressStyle()).accessibilityLabel("대화 초기화")
                    .transition(.scale.combined(with: .opacity))
                }
                // 냉장고 설정 (유통기한 임박 재료 수 배지)
                Button { store.showFridge = true } label: {
                    HStack(spacing: 4) {
                        Image("tool-fridge").resizable().scaledToFit().frame(width: 22, height: 22)
                        if store.soonCount > 0 {
                            Text("\(store.soonCount)").font(.suit(11, .heavy)).foregroundStyle(.white)
                                .frame(minWidth: 18, minHeight: 18).background(Theme.accent, in: Circle())
                        }
                    }
                    .padding(.leading, 10).padding(.trailing, store.soonCount > 0 ? 7 : 10).frame(height: 36)
                    .background(Theme.surface, in: Capsule())
                }
                .buttonStyle(PressStyle()).accessibilityLabel("냉장고 설정")
            }
            .padding(.horizontal, 16).padding(.top, 18).padding(.bottom, 10)
            .animation(.easeOut(duration: 0.2), value: store.msgs.isEmpty)
        }
    }

    // MARK: 첫 화면 (대화 시작 전)

    private var welcome: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer(minLength: 12)
                MascotImage(name: "chef-greeting", size: 176, breathing: true)
                Text(store.greetingName)
                    .font(.suit(22, .bold)).tracking(-0.3).foregroundStyle(Theme.ink).padding(.top, 14)
                Text("가족과 이야기하고,\n\(store.chefName)에게 링크 정리와 냉장고 추천을 맡겨요").font(.suit(13.5)).foregroundStyle(Theme.sub).multilineTextAlignment(.center).lineSpacing(3).padding(.top, 6)
                VStack(spacing: 10) {
                    quickStart(image: "reading-recipe", title: "링크로 레시피 등록", desc: "유튜브·인스타 링크만 붙여넣으면 끝") {
                        startLinkMode()
                    }
                    quickStart(image: "fridge-open", title: "냉장고 파먹기", desc: "소비기한 임박한 재료부터 활용해요") {
                        store.askFridge()
                    }
                }
                .padding(.horizontal, 16).padding(.top, 26)
                Spacer(minLength: 12)
            }
            .containerRelativeFrame(.vertical)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    private func quickStart(image: String, title: String, desc: String, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            HStack(spacing: 12) {
                Circle().fill(Theme.accentSoft).frame(width: 52, height: 52)
                    .overlay(Image(image).resizable().scaledToFit().frame(width: 44, height: 44))
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.suit(15, .bold)).foregroundStyle(Theme.ink)
                    Text(desc).font(.suit(12.5)).foregroundStyle(Theme.sub).lineLimit(1)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint)
            }
            .padding(14).frame(maxWidth: .infinity)
            .paperCard(radius: 20)
            .shadow(color: Color(red: 31 / 255, green: 38 / 255, blue: 60 / 255).opacity(0.06), radius: 10, y: 3)
        }
        .buttonStyle(PressStyle())
    }

    // MARK: 타임라인

    private func key(_ m: Msg) -> String? {
        m.separator != nil ? nil : m.fromMe ? "me" : (m.mate ?? "chef")
    }

    private var timeline: some View {
        let msgs = store.msgs
        return ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(Array(msgs.enumerated()), id: \.element.id) { idx, m in
                        let k = key(m)
                        let first = idx == 0 || key(msgs[idx - 1]) != k
                        let last = idx == msgs.count - 1 || key(msgs[idx + 1]) != k
                        row(m, first: first, last: last, isLastMsg: idx == msgs.count - 1)
                            .padding(.top, idx == 0 ? 0 : (first ? 12 : 3))
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                    if store.typing { typingBubble.padding(.top, 12) }
                    Color.clear.frame(height: 8).id("end")
                }
                .padding(.horizontal, 14).padding(.vertical, 8)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await store.refreshAll() }
            .onChange(of: store.msgs.count) { scroll(proxy) }
            .onChange(of: store.typing) { scroll(proxy) }
            .onAppear { proxy.scrollTo("end") }
        }
        .animation(.easeOut(duration: 0.22), value: store.msgs.count)
    }

    private func scroll(_ proxy: ScrollViewProxy) {
        withAnimation { proxy.scrollTo("end", anchor: .bottom) }
    }

    /// 인스타처럼 같은 사람의 연속 말풍선은 모서리를 붙여서 묶는다
    private func bubbleShape(mine: Bool, first: Bool, last: Bool) -> UnevenRoundedRectangle {
        let big: CGFloat = 20, small: CGFloat = 5
        let top = first ? big : small, bottom = last ? big : small
        return mine
            ? UnevenRoundedRectangle(topLeadingRadius: big, bottomLeadingRadius: big, bottomTrailingRadius: bottom, topTrailingRadius: top, style: .continuous)
            : UnevenRoundedRectangle(topLeadingRadius: top, bottomLeadingRadius: bottom, bottomTrailingRadius: big, topTrailingRadius: big, style: .continuous)
    }

    @ViewBuilder
    private func row(_ m: Msg, first: Bool, last: Bool, isLastMsg: Bool) -> some View {
        if let sep = m.separator {
            Text(sep).font(.suit(12)).foregroundStyle(Theme.faint)
                .frame(maxWidth: .infinity).padding(.vertical, 6)
        } else if m.fromMe {
            VStack(alignment: .trailing, spacing: 6) {
                if let t = m.text {
                    Text(t).font(.suit(15)).lineSpacing(3).foregroundStyle(.white)
                        .padding(.horizontal, 14).padding(.vertical, 9)
                        .background(Theme.accent, in: bubbleShape(mine: true, first: first, last: last && m.card == nil))
                }
                if let c = m.card { ChatCard(kind: c).frame(maxWidth: 340) }
                if let seen = m.seen {
                    Text(seen).font(.suit(11)).foregroundStyle(Theme.faint).padding(.trailing, 4)
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(.leading, 56)
        } else {
            let isChef = m.mate == nil
            HStack(alignment: .bottom, spacing: 8) {
                Group {
                    if last {
                        if let name = m.mate { MateAvatar(name: name) } else { Avatar(name: m.mood, size: 32) }
                    } else {
                        Color.clear.frame(width: 32, height: 1)
                    }
                }
                VStack(alignment: .leading, spacing: 6) {
                    if first {
                        HStack(spacing: 5) {
                            Text(isChef ? store.chefName : "\(m.mate ?? "")셰프").font(.suit(12)).foregroundStyle(Theme.sub)
                            if isChef {
                                Text("AI").font(.suit(9.5, .bold)).foregroundStyle(Theme.accent)
                                    .padding(.horizontal, 5).padding(.vertical, 1).background(Theme.accentSoft, in: Capsule())
                            }
                        }
                        .padding(.leading, 4)
                    }
                    if let t = m.text {
                        Text(t).font(.suit(15)).lineSpacing(3).foregroundStyle(Theme.ink)
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(Theme.surface, in: bubbleShape(mine: false, first: first, last: last && m.card == nil))
                    }
                    if let c = m.card { ChatCard(kind: c).frame(maxWidth: 340) }
                    if !m.actions.isEmpty && isLastMsg {
                        FlowLayout(spacing: 6) {
                            ForEach(Array(m.actions.enumerated()), id: \.offset) { _, a in
                                Chip(label: a.label) { store.perform(a) }
                            }
                        }
                    }
                }
                Spacer(minLength: 24)
            }
        }
    }

    private var typingBubble: some View {
        HStack(alignment: .bottom, spacing: 8) {
            Avatar(name: "chef-greeting", size: 32)
            if let text = store.progress {
                Text(text).font(.suit(14)).foregroundStyle(Theme.ink)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(Theme.surface, in: Capsule())
                    .transition(.opacity)
            } else {
                HStack(spacing: 4) {
                    ForEach(0..<3) { i in
                        Circle().fill(Theme.faint).frame(width: 6, height: 6)
                            .phaseAnimator([0.3, 1.0]) { v, p in v.opacity(p) } animation: { _ in .easeInOut(duration: 0.55).delay(Double(i) * 0.15) }
                    }
                }
                .padding(.horizontal, 16).padding(.vertical, 15)
                .background(Theme.surface, in: Capsule())
            }
            Spacer()
        }
        .animation(.easeOut(duration: 0.2), value: store.progress)
    }

    // MARK: 입력창

    private var composer: some View {
        VStack(spacing: 8) {
            if clipHasLink && input.isEmpty && UIPasteboard.general.changeCount != clipDismissedCount {
                // 시스템 붙여넣기 버튼은 "붙여넣기 허용" 알림 없이 한 번 누르면 바로 읽어 온다
                HStack(spacing: 10) {
                    Image(systemName: "link").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.accent)
                    Text("복사한 링크가 있어요").font(.suit(13.5, .semibold)).foregroundStyle(Theme.ink)
                    Spacer()
                    PasteButton(payloadType: String.self) { strings in
                        let text = strings.joined(separator: " ")
                        clipHasLink = false
                        hint = nil
                        if text.contains("http") { store.submit(text, ai: true) } else { input = text; focused = true }
                    }
                    .labelStyle(.titleOnly).buttonBorderShape(.capsule).tint(Theme.accent).controlSize(.small)
                    Button { clipDismissedCount = UIPasteboard.general.changeCount } label: {
                        Image(systemName: "xmark").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.sub)
                            .frame(width: 26, height: 26)
                    }
                    .buttonStyle(.plain).accessibilityLabel("닫기")
                }
                .padding(.leading, 14).padding(.trailing, 8).padding(.vertical, 6)
                .background(Theme.accentSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .transition(.opacity)
            }
            // 첫 대화 이후에도 AI 기능은 입력창 바로 위에서 계속 고를 수 있다
            if !store.msgs.isEmpty && !focused {
                HStack(spacing: 8) {
                    optionChip(image: "reading-recipe", title: "링크로 레시피 등록", on: linkMode) { if linkMode { linkMode = false; hint = nil } else { startLinkMode() } }
                    optionChip(image: "fridge-open", title: "냉장고 파먹기", on: false) { linkMode = false; hint = nil; store.askFridge() }
                    Spacer(minLength: 0)
                }
                .transition(.opacity)
            }
            if let hint {
                Text(hint).font(.suit(12.5)).foregroundStyle(Theme.accent)
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(Theme.accentSoft, in: Capsule())
                    .transition(.opacity)
            }
            HStack(spacing: 8) {
                Button { startLinkMode() } label: {
                    Image(systemName: "link").font(.system(size: 17, weight: .medium)).foregroundStyle(linkMode ? Theme.accent : Theme.faint)
                        .frame(width: 30, height: 36)
                }
                .buttonStyle(PressStyle()).accessibilityLabel("링크 입력")

                TextField(linkMode ? "유튜브·인스타 링크를 붙여넣어 주세요" : (store.isRemote ? "가족에게 메시지 보내기" : "메시지 보내기"), text: $input)
                    .focused($focused).font(.suit(16)).submitLabel(.send).onSubmit(send)
                    .textInputAutocapitalization(.never).autocorrectionDisabled()

                Button(action: send) {
                    Image(systemName: "arrow.up").font(.system(size: 15, weight: .bold))
                        .foregroundStyle(canSend ? .white : Theme.faint)
                        .frame(width: 38, height: 38)
                        .background(canSend ? Theme.accent : Theme.surface, in: Circle())
                }
                .buttonStyle(PressStyle()).disabled(!canSend).accessibilityLabel("보내기")
            }
            .padding(.leading, 14).padding(.trailing, 6).padding(.vertical, 6)
            .background(Color.white, in: Capsule())
            .overlay(Capsule().strokeBorder(Theme.border, lineWidth: 1))
            .shadow(color: Color(red: 31 / 255, green: 38 / 255, blue: 60 / 255).opacity(0.08), radius: 12, y: 4)
        }
        .padding(.horizontal, 14).padding(.top, 8).padding(.bottom, 8)
        .background(Color.white)
        .animation(.easeOut(duration: 0.15), value: canSend)
        .animation(.easeOut(duration: 0.15), value: hint)
        .animation(.easeOut(duration: 0.15), value: clipHasLink)
    }

    /// 클립보드에 링크가 있는지만 확인한다 (내용을 읽지 않으므로 iOS 붙여넣기 알림이 뜨지 않는다)
    private func refreshClipboard() {
        Task {
            let key: PartialKeyPath<UIPasteboard.DetectedValues> = \.probableWebURL
            let found = try? await UIPasteboard.general.detectedPatterns(for: [key])
            clipHasLink = found?.contains(key) ?? false
        }
    }

    private var canSend: Bool { !input.trimmingCharacters(in: .whitespaces).isEmpty }

    private func send() {
        guard canSend else { return }
        let t = input
        if linkMode && !t.contains("http") { hint = "링크(https://...)를 붙여넣어 주세요"; return }   // AI 는 링크 정리·냉장고 추천만 맡는다
        input = ""
        hint = nil
        store.submit(t, ai: linkMode)
        linkMode = false
    }

    private func startLinkMode() {
        linkMode = true
        hint = "유튜브·인스타 링크를 붙여넣어 주세요"
        focused = true
    }

    private func optionChip(image: String, title: String, on: Bool, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            HStack(spacing: 6) {
                Image(image).resizable().scaledToFit().frame(width: 22, height: 22)
                Text(title).font(.suit(13, .bold)).foregroundStyle(on ? Theme.accent : Theme.ink)
            }
            .padding(.leading, 8).padding(.trailing, 12).padding(.vertical, 6)
            .background(on ? Theme.accentSoft : Theme.surface, in: Capsule())
        }
        .buttonStyle(PressStyle())
    }
}

/// 줄바꿈되는 가로 배치
struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal.width ?? 320, subviews).size
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let a = arrange(bounds.width, subviews)
        for (i, p) in a.points.enumerated() {
            subviews[i].place(at: CGPoint(x: bounds.minX + p.x, y: bounds.minY + p.y), proposal: .unspecified)
        }
    }
    private func arrange(_ width: CGFloat, _ subviews: Subviews) -> (points: [CGPoint], size: CGSize) {
        var x: CGFloat = 0, y: CGFloat = 0, rowH: CGFloat = 0, maxX: CGFloat = 0
        var pts: [CGPoint] = []
        for s in subviews {
            let sz = s.sizeThatFits(.unspecified)
            if x + sz.width > width, x > 0 { x = 0; y += rowH + spacing; rowH = 0 }
            pts.append(CGPoint(x: x, y: y))
            x += sz.width + spacing; rowH = max(rowH, sz.height); maxX = max(maxX, x - spacing)
        }
        return (pts, CGSize(width: maxX, height: y + rowH))
    }
}

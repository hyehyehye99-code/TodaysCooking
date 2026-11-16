import SwiftUI

// MARK: - 마이페이지와 주방 설정이 함께 쓰는 조각들

struct InviteCard: View {
    @Environment(Store.self) private var store
    var body: some View {
        if store.inviteCode.isEmpty {
            InlineCard(icon: "happy", title: "우리집 레시피 초대", sub: "로그인하면 가족을 초대할 수 있어요",
                       actions: [CardAction(label: "로그인하러 가기", kind: .primary) { store.showKitchenSettings = false; store.tab = .my }])
        } else {
            InlineCard(
                icon: "happy", title: "우리집 레시피 초대", sub: "링크를 보내면 상대방이 눌러서 바로 참여할 수 있어요",
                meta: [("초대 코드", store.inviteCode)],
                actions: [
                    CardAction(label: "코드 복사", kind: .primary) { store.copy(store.inviteCode, done: "복사했어요!") },
                    CardAction(label: "링크 복사") { store.copy(store.inviteLink, done: "링크를 복사했어요!") },
                ]
            ) {
                Text(store.inviteCode).font(.suit(26, .heavy)).tracking(3).foregroundStyle(Theme.ink)
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
    }
}

struct FamilySection: View {
    @Environment(Store.self) private var store
    @State private var selected: Member?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 위쪽 "가족 초대" 줄과 겹쳐 잘못 눌리지 않도록 관리 버튼은 없앴다: 참여자를 눌러야 내보내기가 나온다
            SectionLabel("참여 인원 · \(store.members.count)명")
            VStack(spacing: 0) {
                ForEach(Array(store.members.enumerated()), id: \.element.id) { i, m in
                    row(m)
                    if i < store.members.count - 1 { Divider().overlay(Theme.border) }
                }
            }
            .padding(.horizontal, 16).paperCard()
        }
        .sheet(item: $selected) { m in MemberSheet(member: m) }
        .task {
            // 화면 확인용 실행 인자 (-membersheet)
            #if DEBUG
            try? await Task.sleep(for: .seconds(1.5))
            if UserDefaults.standard.bool(forKey: "membersheet") { selected = store.members.first { !$0.isMe } }
            #endif
        }
    }

    @ViewBuilder
    private func row(_ m: Member) -> some View {
        let content = HStack(spacing: 12) {
            ProfileIconView(icon: m.icon, name: m.name, size: 40)
            VStack(alignment: .leading, spacing: 1) {
                Text(m.name).font(.suit(15, .semibold)).foregroundStyle(Theme.ink)
                Text(m.role).font(.suit(12.5)).foregroundStyle(Theme.sub)
            }
            Spacer()
            if !m.isMe { Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint) }
        }
        .padding(.vertical, 12).contentShape(Rectangle())

        if m.isMe { content } else { Button { selected = m } label: { content }.buttonStyle(.plain) }
    }
}

/// 참여자를 누르면 열리는 작은 창: 내보내기는 여기서 한 번 더 확인한다
struct MemberSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let member: Member
    @State private var confirming = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 14) {
                ProfileIconView(icon: member.icon, name: member.name, size: 56)
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(member.name)셰프").font(.suit(20, .bold)).tracking(-0.3)
                    Text(member.role).font(.suit(13)).foregroundStyle(Theme.sub)
                }
            }
            if confirming {
                Text("\(member.name)님을 내보낼까요?").font(.suit(16, .bold))
                Text("내보내면 이 우리집의 메뉴판·냉장고·장보기 목록에 더 이상 접근할 수 없어요.")
                    .font(.suit(13.5)).foregroundStyle(Theme.sub).lineSpacing(3)
                HStack(spacing: 8) {
                    Button { confirming = false } label: {
                        Text("취소").font(.suit(15, .bold)).foregroundStyle(Theme.ink)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    Button { store.removeMember(member); dismiss() } label: {
                        Text("내보내기").font(.suit(15, .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Theme.warn, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
                .buttonStyle(PressStyle())
            } else {
                Button { withAnimation(.easeOut(duration: 0.15)) { confirming = true } } label: {
                    Text("이 참여자 내보내기").font(.suit(15, .semibold)).foregroundStyle(Theme.warn)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(PressStyle())
            }
        }
        .sheetChrome(confirming ? 330 : 230)
    }
}

// MARK: - 주방 설정 (대화 헤더의 주방 이름 → 왼쪽에서 오른쪽으로 슬라이드)
// 원칙: 자주 안 쓰는 건 작게, 바꾸는 건 저장을 눌러야 반영, 나가기는 숨겨서 이름을 직접 입력해야만 가능

private enum KitchenSheet: Identifiable {
    case renameKitchen, renameChef, invite, switcher, leave
    var id: Int { hashValue }
}

struct KitchenSettingsView: View {
    @Environment(Store.self) private var store
    @State private var sheet: KitchenSheet?
    @State private var alarm = PushManager.shared.isEnabled

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    currentCard

                    VStack(spacing: 0) {
                        valueRow("주방 이름", value: store.kitchenTitle) { sheet = .renameKitchen }
                        Divider().overlay(Theme.border)
                        valueRow("AI 셰프 이름", value: store.chefName) { sheet = .renameChef }
                        Divider().overlay(Theme.border)
                        valueRow("가족 초대", value: "코드·링크") { sheet = .invite }
                    }
                    .padding(.horizontal, 16).paperCard()

                    FamilySection()

                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel("알림")
                        Toggle(isOn: Binding(get: { alarm }, set: { on in
                            alarm = on
                            Task {
                                if on {
                                    if await !PushManager.shared.enable() {
                                        alarm = false
                                        store.showToast("설정에서 알림 권한을 허용해주세요.")
                                    }
                                } else { await PushManager.shared.disable() }
                            }
                        })) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("알림").font(.suit(15, .semibold))
                                Text("다른 가족이 장보기에 항목을 추가하면 알려드려요.").font(.suit(12.5)).foregroundStyle(Theme.sub)
                            }
                        }
                        .tint(Theme.accent)
                        .padding(.horizontal, 16).padding(.vertical, 12).paperCard()
                    }
                }
                .padding(16).padding(.bottom, 24)
            }
        }
        .background(Theme.background.ignoresSafeArea())
        // 왼쪽으로 쓸어 넘겨도 닫힌다
        .gesture(DragGesture(minimumDistance: 24).onEnded { if $0.translation.width < -80 { store.showKitchenSettings = false } })
        .task {
            // 화면 확인용 실행 인자 (-kitchensheet rename|chef|invite|switch|leave)
            #if DEBUG
            try? await Task.sleep(for: .seconds(1.5))
            switch UserDefaults.standard.string(forKey: "kitchensheet") {
            case "rename": sheet = .renameKitchen
            case "chef": sheet = .renameChef
            case "invite": sheet = .invite
            case "switch": sheet = .switcher
            case "leave": sheet = .leave
            default: break
            }
            #endif
        }
        .sheet(item: $sheet) { which in
            switch which {
            case .renameKitchen:
                RenameSheet(title: "주방 이름 바꾸기", initial: store.kitchenName, placeholder: "예) 영공이네", suffix: "주방",
                            note: "가족 모두에게 이 이름으로 보여요.") { store.renameKitchen($0) }
            case .renameChef:
                RenameSheet(title: "AI 셰프 이름 바꾸기", initial: store.chefName, placeholder: "예) 곰셰프", suffix: nil,
                            note: "대화방에서 이 이름으로 불려요.") { store.renameChef($0) }
            case .invite:
                InviteSheet()
            case .switcher:
                SwitchKitchenSheet()
            case .leave:
                LeaveKitchenSheet { store.showKitchenSettings = false }
            }
        }
    }

    // MARK: 머리말 — 나가기는 ⋯ 메뉴 안에 숨겨 둔다

    private var header: some View {
        ZStack {
            Text("주방 설정").font(.suit(17, .bold))
            HStack {
                Button { store.showKitchenSettings = false } label: {
                    Image(systemName: "chevron.left").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.ink)
                        .frame(width: 40, height: 40).background(Theme.card, in: Circle())
                        .overlay(Circle().strokeBorder(Theme.border, lineWidth: 1))
                }
                .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
                Spacer()
                Menu {
                    Button("주방 나가기…", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) { sheet = .leave }
                } label: {
                    Image(systemName: "ellipsis").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.sub)
                        .frame(width: 40, height: 40).background(Theme.surface, in: Circle())
                }
                .accessibilityLabel("더보기")
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
    }

    // MARK: 지금 쓰는 주방 + 주방 바꾸기

    private var currentCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Avatar(name: "chef-greeting", size: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.kitchenTitle).font(.suit(18, .bold)).foregroundStyle(Theme.ink)
                    Text("참여 인원 \(store.members.count)명").font(.suit(13)).foregroundStyle(Theme.sub)
                }
                Spacer()
                Text("사용 중").font(.suit(12, .bold)).foregroundStyle(Theme.accent)
                    .padding(.horizontal, 10).padding(.vertical, 4).background(Theme.accentSoft, in: Capsule())
            }
            Button { sheet = .switcher } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.left.arrow.right").font(.system(size: 12, weight: .bold))
                    Text("주방 바꾸기").font(.suit(14, .bold))
                }
                .foregroundStyle(Theme.ink).frame(maxWidth: .infinity).padding(.vertical, 12)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(PressStyle())
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: Theme.radius, style: .continuous).strokeBorder(Theme.accent, lineWidth: 1.5))
    }

    private func valueRow(_ title: String, value: String, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            HStack(spacing: 8) {
                Text(title).font(.suit(15, .semibold)).foregroundStyle(Theme.ink)
                Spacer()
                Text(value).font(.suit(14)).foregroundStyle(Theme.sub).lineLimit(1)
                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint)
            }
            .padding(.vertical, 15).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 작은 창 공통 틀

private struct SheetChrome: ViewModifier {
    let height: CGFloat
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 20).padding(.top, 24).padding(.bottom, 12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .presentationBackground(Theme.background)
            .presentationDetents([.height(height)])
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(28)
    }
}
private extension View { func sheetChrome(_ height: CGFloat) -> some View { modifier(SheetChrome(height: height)) } }

// MARK: - 이름 바꾸기: 바로 바뀌지 않고, 저장을 눌러야 반영된다

struct RenameSheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let initial: String
    let placeholder: String
    let suffix: String?
    let note: String
    let onSave: (String) -> Void
    @State private var text = ""
    @FocusState private var focused: Bool

    private var changed: Bool {
        let t = text.trimmingCharacters(in: .whitespaces)
        return !t.isEmpty && t != initial
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title).font(.suit(20, .bold)).tracking(-0.3)
            HStack {
                TextField(placeholder, text: $text).font(.suit(16, .semibold)).focused($focused).submitLabel(.done)
                if let suffix { Text(suffix).font(.suit(16)).foregroundStyle(Theme.sub) }
            }
            .padding(.horizontal, 16).frame(height: 52)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            Text(note).font(.suit(12.5)).foregroundStyle(Theme.sub)
            HStack(spacing: 8) {
                Button { dismiss() } label: {
                    Text("취소").font(.suit(15, .bold)).foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Button { onSave(text); dismiss() } label: {
                    Text("저장").font(.suit(15, .bold)).foregroundStyle(changed ? .white : Theme.faint)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(changed ? Theme.accent : Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .disabled(!changed)
            }
            .buttonStyle(PressStyle())
        }
        .sheetChrome(270)
        .onAppear { text = initial; focused = true }
    }
}

// MARK: - 가족 초대 (처음에만 쓰는 기능이라 작은 창으로)

struct InviteSheet: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("가족 초대").font(.suit(20, .bold)).tracking(-0.3)
            InviteCard()
        }
        .sheetChrome(470)
    }
}

// MARK: - 주방 바꾸기 / 새로 만들기 / 코드로 참여

struct SwitchKitchenSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    private enum Mode { case list, create, join }
    @State private var mode: Mode = .list
    @State private var selected = 0
    @State private var text = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            switch mode {
            case .list: list
            case .create: form(title: "새 주방 만들기", placeholder: "예) 우리 가족 주방", button: "만들기") { store.createKitchen(named: text); dismiss() }
            case .join: form(title: "코드로 참여하기", placeholder: "초대 코드 입력", button: "참여하기") { store.joinKitchen(code: text); dismiss() }
            }
        }
        .sheetChrome(mode == .list ? CGFloat(270 + store.kitchens.count * 64) : 300)
        .onAppear { selected = store.currentKitchen }
    }

    private var list: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("주방 바꾸기").font(.suit(20, .bold)).tracking(-0.3)
            VStack(spacing: 0) {
                ForEach(Array(store.kitchens.enumerated()), id: \.element.id) { i, k in
                    Button { selected = i } label: {
                        HStack(spacing: 12) {
                            Circle().strokeBorder(selected == i ? Theme.accent : Color(hex: 0xD3D6DB), lineWidth: 1.6)
                                .background(Circle().fill(selected == i ? Theme.accent : .white))
                                .frame(width: 22, height: 22)
                                .overlay { if selected == i { Circle().fill(.white).frame(width: 8, height: 8) } }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(k.name).font(.suit(16, .semibold)).foregroundStyle(Theme.ink)
                                Text("참여 인원 \(k.members.count)명").font(.suit(12.5)).foregroundStyle(Theme.sub)
                            }
                            Spacer()
                            if i == store.currentKitchen { Text("사용 중").font(.suit(12, .bold)).foregroundStyle(Theme.accent) }
                        }
                        .padding(.vertical, 12).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if i < store.kitchens.count - 1 { Divider().overlay(Theme.border) }
                }
            }
            .padding(.horizontal, 16).paperCard()

            HStack(spacing: 8) {
                smallAction("+ 새 주방 만들기") { text = ""; mode = .create }
                smallAction("코드로 참여하기") { text = ""; mode = .join }
            }
            PrimaryButton(title: "이 주방으로 바꾸기", disabled: selected == store.currentKitchen) {
                store.switchKitchen(to: selected); dismiss()
            }
        }
    }

    private func smallAction(_ t: String, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            Text(t).font(.suit(13.5, .bold)).foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity).padding(.vertical, 12)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(PressStyle())
    }

    private func form(title: String, placeholder: String, button: String, run: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Button { mode = .list } label: {
                    Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                        .frame(width: 34, height: 34).background(Theme.surface, in: Circle())
                }
                Text(title).font(.suit(20, .bold)).tracking(-0.3)
            }
            TextField(placeholder, text: $text).font(.suit(16))
                .padding(.horizontal, 16).frame(height: 52)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            PrimaryButton(title: button, disabled: text.trimmingCharacters(in: .whitespaces).isEmpty, action: run)
        }
    }
}

// MARK: - 주방 나가기: 숨겨진 메뉴 + 주방 이름을 직접 입력해야만 가능

struct LeaveKitchenSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let done: () -> Void
    @State private var typed = ""

    private var matches: Bool { typed.trimmingCharacters(in: .whitespaces) == store.kitchenName }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("정말 이 우리집에서 나가시겠어요?").font(.suit(20, .bold)).tracking(-0.3)
            VStack(alignment: .leading, spacing: 6) {
                Text("대장 자리는 가장 먼저 들어온 다른 참여자에게 자동으로 넘어가요.")
                Text("언제든 초대 코드나 링크로 다시 참여할 수 있어요.")
            }
            .font(.suit(13.5)).foregroundStyle(Theme.sub).lineSpacing(3)
            Text("확인을 위해 우리집 이름 \(store.kitchenName)을(를) 입력해주세요.").font(.suit(13, .semibold))
            TextField(store.kitchenName, text: $typed).font(.suit(16))
                .padding(.horizontal, 16).frame(height: 52)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            HStack(spacing: 8) {
                Button { dismiss() } label: {
                    Text("취소").font(.suit(15, .bold)).foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Button {
                    if store.leaveKitchen() { dismiss(); done() } else { dismiss() }
                } label: {
                    Text("나가기").font(.suit(15, .bold)).foregroundStyle(matches ? .white : Theme.faint)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(matches ? Theme.warn : Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .disabled(!matches)
            }
            .buttonStyle(PressStyle())
        }
        .sheetChrome(390)
    }
}

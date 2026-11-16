import SwiftUI

// MARK: - 마이페이지 (기존 우리집 레시피 웹 구조를 따라 단순화)

struct MyView: View {
    @Environment(Store.self) private var store

    private let site = "https://ourhomemenu.vercel.app"

    var body: some View {
        @Bindable var store = store
        NavigationStack(path: $store.myPath) {
            Screen {
                VStack(spacing: 0) {
                    PageHeader(title: "마이페이지", showKitchen: false)
                    ScrollView {
                        VStack(spacing: 12) {
                            profileCard
                            householdHeader
                            kitchenCard
                            group {
                                navRow("메뉴판", icon: "tool-recipebook", route: .mealboard); divider
                                navRow("타이머", icon: "tool-timer", route: .timers)
                            }
                            group { navRow("보유중인 재료", icon: "tool-fridge", route: .fridge) }
                            group {
                                navRow("계정 관리", route: .account); divider
                                navRow("태그 관리", route: .tags); divider
                                navRow("활동 로그", route: .activity)
                            }
                            group {
                                navRow("소개", route: .about); divider
                                linkRow("문의하기", path: "/support"); divider
                                linkRow("이용약관", path: "/terms"); divider
                                linkRow("개인정보처리방침", path: "/privacy")
                            }
                        }
                        .padding(.horizontal, 16).padding(.bottom, 24)
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: MyRoute.self) { route in
                switch route {
                case .profile: ProfilePage()
                case .usage: UsagePage()
                case .mealboard: MealboardListPage()
                case .mealboardForm(let id): MealboardFormPage(editingId: id)
                case .mealboardDetail(let id): MealboardDetailPage(boardId: id)
                case .recipe(let id): RecipeDetailView(recipeId: id) { store.myPath.append(.recipeForm($0)) }
                case .recipeForm(let id): NewRecipeView(editingId: id)
                case .timers: TimersPage()
                case .fridge: FridgePage()
                case .account: AccountPage()
                case .tags: TagsPage()
                case .activity: ActivityPage()
                case .about: AboutPage()
                }
            }
        }
    }

    private var me: Member? { store.members.first(where: \.isMe) }

    private var profileCard: some View {
        VStack(spacing: 0) {
            NavigationLink(value: MyRoute.profile) {
                HStack(spacing: 12) {
                    Circle().fill(Theme.surface).frame(width: 52, height: 52)
                        .overlay(Image("food-tomato").resizable().scaledToFit().frame(width: 40, height: 40))
                    Text("\(me?.name ?? "")셰프").font(.suit(17, .bold)).foregroundStyle(Theme.ink)
                    Spacer()
                    chevron
                }
                .padding(.vertical, 14).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            Divider().overlay(Theme.border)
            NavigationLink(value: MyRoute.usage) {
                HStack(spacing: 10) {
                    Image("idea").resizable().scaledToFit().frame(width: 34, height: 34)
                    Text("AI 사용량").font(.suit(15, .semibold)).foregroundStyle(Theme.ink)
                    Spacer()
                    Text("프로모션 보너스 \(store.aiBonus)회 남음").font(.suit(12.5)).foregroundStyle(Theme.sub)
                    chevron
                }
                .padding(.vertical, 12).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).paperCard()
    }

    private var householdHeader: some View {
        HStack {
            SectionLabel("우리집 관리")
            Spacer()
            Button("+ 우리집 추가") { store.showToast("목업이라 연결되어 있지 않아요") }
                .font(.suit(13, .semibold)).foregroundStyle(Theme.sub).padding(.horizontal, 8)
        }
        .padding(.top, 6)
    }

    private var kitchenCard: some View {
        Button { store.showKitchenSettings = true } label: {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    HStack(spacing: 4) {
                        Text(store.kitchenName).font(.suit(16, .bold)).foregroundStyle(Theme.ink)
                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(Theme.faint)
                    }
                    Spacer()
                    Text("사용 중").font(.suit(12, .bold)).foregroundStyle(Theme.accent)
                        .padding(.horizontal, 10).padding(.vertical, 4).background(Theme.accentSoft, in: Capsule())
                }
                HStack {
                    Text("참여 인원 \(store.members.count)명").font(.suit(13)).foregroundStyle(Theme.sub)
                    Spacer()
                    Text("초대하기").font(.suit(13, .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 14).padding(.vertical, 9)
                        .background(Theme.accent, in: Capsule())
                        .onTapGesture { store.copy(Sample.inviteLink, done: "링크를 복사했어요!") }
                }
            }
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: Theme.radius, style: .continuous).strokeBorder(Theme.accent, lineWidth: 1.5))
        }
        .buttonStyle(PressStyle())
    }

    // MARK: 행 조각

    private var chevron: some View {
        Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint)
    }
    private var divider: some View { Divider().overlay(Theme.border) }

    private func group<C: View>(@ViewBuilder _ content: () -> C) -> some View {
        VStack(spacing: 0) { content() }.padding(.horizontal, 16).paperCard()
    }

    private func rowLabel(_ title: String, icon: String?) -> some View {
        HStack(spacing: 12) {
            if let icon {
                Circle().fill(Theme.surface).frame(width: 38, height: 38)
                    .overlay(Image(icon).resizable().scaledToFit().frame(width: 28, height: 28))
            }
            Text(title).font(.suit(15, .semibold)).foregroundStyle(Theme.ink)
            Spacer()
            chevron
        }
        .padding(.vertical, icon == nil ? 15 : 10).contentShape(Rectangle())
    }

    private func navRow(_ title: String, icon: String? = nil, route: MyRoute) -> some View {
        NavigationLink(value: route) { rowLabel(title, icon: icon) }.buttonStyle(.plain)
    }

    @ViewBuilder
    private func linkRow(_ title: String, path: String) -> some View {
        if let url = URL(string: site + path) {
            Link(destination: url) { rowLabel(title, icon: nil) }
        }
    }
}

// MARK: - 하위 페이지 공통 틀 (뒤로가기 + 제목, 전체 페이지)

struct SubPage<Content: View>: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                        .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
                }
                .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
                Text(title).font(.suit(22, .bold)).tracking(-0.4)
                Spacer()
            }
            .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 12)
            ScrollView {
                VStack(alignment: .leading, spacing: 14) { content() }
                    .padding(.horizontal, 16).padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
    }
}

// MARK: - 프로필

struct ProfilePage: View {
    @Environment(Store.self) private var store
    @State private var name = ""
    @State private var loaded = false

    var body: some View {
        SubPage(title: "프로필") {
            VStack(spacing: 14) {
                Circle().fill(Theme.surface).frame(width: 92, height: 92)
                    .overlay(Image("food-tomato").resizable().scaledToFit().frame(width: 70, height: 70))
                    .frame(maxWidth: .infinity)
                VStack(alignment: .leading, spacing: 8) {
                    SectionLabel("닉네임")
                    TextField("예) 영공", text: $name).font(.suit(16))
                        .padding(.horizontal, 16).frame(height: 52).paperCard(radius: 16)
                    Text("우리집 안에서 “\(name.trimmingCharacters(in: .whitespaces))셰프”로 불려요")
                        .font(.suit(12.5)).foregroundStyle(Theme.sub).padding(.horizontal, 8)
                }
                PrimaryButton(title: "저장", disabled: name.trimmingCharacters(in: .whitespaces).isEmpty) { store.renameMe(name) }
            }
        }
        .onAppear { if !loaded { loaded = true; name = store.members.first(where: \.isMe)?.name ?? "" } }
    }
}

// MARK: - AI 사용량

struct UsagePage: View {
    @Environment(Store.self) private var store

    var body: some View {
        SubPage(title: "AI 사용량") {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 10) {
                        Image("idea").resizable().scaledToFit().frame(width: 40, height: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("이번 주 AI 자동 정리 \(store.aiUsed)/\(store.aiLimit)회 사용").font(.suit(15, .bold))
                            Text("프로모션 보너스 \(store.aiBonus)회 남음").font(.suit(12.5)).foregroundStyle(Theme.sub)
                        }
                    }
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Theme.surface)
                            Capsule().fill(Theme.accent).frame(width: g.size.width * CGFloat(store.aiUsed) / CGFloat(store.aiLimit))
                        }
                    }
                    .frame(height: 8)
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard()

                VStack(alignment: .leading, spacing: 8) {
                    Text("AI 자동 작성 안내").font(.suit(15, .bold))
                    ForEach([
                        "· AI 자동 정리는 유튜브·인스타그램 링크에 적용돼요.",
                        "· 무료로는 일주일에 20번까지 쓸 수 있어요.",
                        "· 영상 설명란·댓글이나 게시물 캡션에 재료·만드는 법이 적혀있으면 더 정확하게 가져와요.",
                        "· 결과가 마음에 안 들면 “결과가 별로였나요? 보고해주세요”로 알려주세요 — 확인 후 사용 횟수를 돌려드릴 수 있어요.",
                    ], id: \.self) { Text($0).font(.suit(13.5)).foregroundStyle(Theme.sub).lineSpacing(3) }
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
        }
    }
}

// MARK: - 타이머

struct TimersPage: View {
    @Environment(Store.self) private var store
    @State private var name = ""
    @State private var minutes = 5

    var body: some View {
        SubPage(title: "타이머") {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("새 타이머").font(.suit(15, .bold))
                    TextField("예) 계란 삶기", text: $name).font(.suit(16)).padding(.horizontal, 16).frame(height: 48)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    HStack {
                        Text("시간").font(.suit(14)).foregroundStyle(Theme.sub)
                        Spacer()
                        stepper("minus") { minutes = max(1, minutes - 1) }
                        Text("\(minutes)분").font(.suit(15, .bold)).monospacedDigit().frame(width: 56)
                        stepper("plus") { minutes = min(99, minutes + 1) }
                    }
                    PrimaryButton(title: "타이머 저장", disabled: name.trimmingCharacters(in: .whitespaces).isEmpty) {
                        store.timers.append(SavedTimer(name: name.trimmingCharacters(in: .whitespaces), sec: minutes * 60))
                        name = ""
                    }
                }
                .padding(16).paperCard()

                if store.timers.isEmpty {
                    Text("등록된 타이머가 없어요. 요리할 때 타이머를 만들어보세요.")
                        .font(.suit(13.5)).foregroundStyle(Theme.sub).frame(maxWidth: .infinity).padding(.top, 12)
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(store.timers.enumerated()), id: \.element.id) { i, t in
                            HStack(spacing: 12) {
                                Image("tool-timer").resizable().scaledToFit().frame(width: 30, height: 30)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(t.name).font(.suit(15, .semibold))
                                    Text(timerLabel(t.sec)).font(.suit(12.5)).foregroundStyle(Theme.sub)
                                }
                                Spacer()
                                Button("시작") { store.startTimer(sec: t.sec, label: t.name) }
                                    .font(.suit(13, .bold)).foregroundStyle(.white)
                                    .padding(.horizontal, 14).padding(.vertical, 8).background(Theme.accent, in: Capsule())
                                Button("삭제") { store.timers.removeAll { $0.id == t.id } }
                                    .font(.suit(13, .semibold)).foregroundStyle(Theme.warn)
                            }
                            .padding(.vertical, 11)
                            if i < store.timers.count - 1 { Divider().overlay(Theme.border) }
                        }
                    }
                    .padding(.horizontal, 16).paperCard()
                }
            }
        }
    }

    private func stepper(_ icon: String, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            Image(systemName: icon).font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.ink)
                .frame(width: 34, height: 34).background(Theme.surface, in: Circle())
        }
        .buttonStyle(PressStyle())
    }
}

// MARK: - 계정 관리

struct AccountPage: View {
    @Environment(Store.self) private var store
    @State private var askDelete = false

    var body: some View {
        SubPage(title: "계정 관리") {
            VStack(alignment: .leading, spacing: 8) {
                SectionLabel("연결된 계정")
                HStack(spacing: 12) {
                    Image(systemName: "apple.logo").font(.system(size: 20)).frame(width: 38, height: 38)
                        .background(Theme.surface, in: Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Apple로 가입했어요").font(.suit(15, .semibold))
                        Text("hello@example.com").font(.suit(12.5)).foregroundStyle(Theme.sub)
                    }
                    Spacer()
                }
                .padding(14).paperCard()
            }
            Button { store.showToast("목업이라 로그아웃은 없어요") } label: {
                Text("로그아웃").font(.suit(15, .semibold)).foregroundStyle(Theme.ink)
                    .frame(maxWidth: .infinity).padding(.vertical, 15).paperCard()
            }
            .buttonStyle(PressStyle())
            Button { askDelete = true } label: {
                Text("회원 탈퇴").font(.suit(15, .semibold)).foregroundStyle(Theme.warn)
                    .frame(maxWidth: .infinity).padding(.vertical, 15).paperCard()
            }
            .buttonStyle(PressStyle())
        }
        .confirmationDialog("탈퇴하면 계정이 완전히 삭제돼요", isPresented: $askDelete, titleVisibility: .visible) {
            Button("탈퇴하기", role: .destructive) { store.showToast("목업이라 탈퇴는 되지 않아요") }
            Button("취소", role: .cancel) {}
        } message: {
            Text("내가 대장인 우리집은 가장 먼저 들어온 다른 참여자에게 넘어가고, 나 혼자 있는 우리집은 함께 삭제돼요. 되돌릴 수 없어요.")
        }
    }
}

// MARK: - 태그 관리

struct TagsPage: View {
    @Environment(Store.self) private var store
    var body: some View {
        SubPage(title: "태그 관리") {
            Text("레시피와 북마크에 쓴 태그 이름을 한 번에 바꿀 수 있어요.").font(.suit(13.5)).foregroundStyle(Theme.sub)
            VStack(spacing: 0) {
                ForEach(Array(RecipeCategory.allCases.enumerated()), id: \.element.id) { i, c in
                    HStack {
                        Text("# \(c.rawValue)").font(.suit(15, .semibold))
                        Text("\(store.savedRecipes.filter { $0.cat == c }.count)개").font(.suit(12.5)).foregroundStyle(Theme.sub)
                        Spacer()
                        Button("이름 바꾸기") { store.showToast("목업이라 연결되어 있지 않아요") }
                            .font(.suit(13, .semibold)).foregroundStyle(Theme.accent)
                    }
                    .padding(.vertical, 14)
                    if i < RecipeCategory.allCases.count - 1 { Divider().overlay(Theme.border) }
                }
            }
            .padding(.horizontal, 16).paperCard()
        }
    }
}

// MARK: - 활동 로그

struct ActivityPage: View {
    private let items: [(String, String)] = [
        ("엄마셰프가 장보기에 우유를 추가했어요", "방금"),
        ("민준셰프가 된장찌개를 즐겨찾기했어요", "12분 전"),
        ("영공셰프가 간장 어묵볶음을 등록했어요", "2시간 전"),
        ("엄마셰프가 장보기를 끝냈어요", "1일 전"),
    ]
    var body: some View {
        SubPage(title: "활동 로그") {
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, it in
                    HStack(alignment: .top) {
                        Text(it.0).font(.suit(14.5)).foregroundStyle(Theme.ink).lineSpacing(2)
                        Spacer(minLength: 12)
                        Text(it.1).font(.suit(12)).foregroundStyle(Theme.faint)
                    }
                    .padding(.vertical, 14)
                    if i < items.count - 1 { Divider().overlay(Theme.border) }
                }
            }
            .padding(.horizontal, 16).paperCard()
        }
    }
}

// MARK: - 소개

struct AboutPage: View {
    private let features: [(String, String)] = [
        ("AI가 알아서 정리해줘요", "유튜브·인스타·블로그 링크 하나만 넣으면 재료와 만드는 법을 AI가 자동으로 정리해요."),
        ("냉장고, 탭 한 번으로", "지금 냉장고에 뭐가 있는지 탭 한 번으로 체크하고 관리해요."),
        ("레시피·냉장고·장보기가 하나로", "레시피에 부족한 재료는 장보기에 자동으로 담기고, 장보기를 끝내면 냉장고에도 알아서 반영돼요."),
        ("가족과 함께 쓰는 우리집", "초대 코드 하나로 가족을 우리집에 초대하고, 레시피와 장보기 목록을 같이 관리해요."),
        ("무슨 일이 있었는지 알림으로", "가족이 장보기에 뭔가 추가하거나 장보기를 끝내면 바로 알려드려요."),
    ]
    var body: some View {
        SubPage(title: "소개") {
            VStack(spacing: 8) {
                MascotImage(name: "chef-greeting", size: 120, breathing: true)
                Text("흩어진 레시피를 한곳에,\n필요한 재료를 한눈에!").font(.suit(22, .bold)).multilineTextAlignment(.center).tracking(-0.3)
                Text("요리를 좋아하는 사람들을 위한, 가족이 함께 쓰는 레시피예요").font(.suit(13.5)).foregroundStyle(Theme.sub).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity).padding(.top, 4)

            VStack(alignment: .leading, spacing: 8) {
                SectionLabel("왜 만들었나요")
                Text("유튜브·인스타·블로그에 저장만 해두고 막상 요리할 땐 어디 있는지 못 찾고, 장을 보러 가서는 뭘 사야 할지 헷갈리고, 냉장고를 열어봐도 뭐가 있는지 몰라 요리를 미루게 되는 반복되는 불편함이 있었어요. 그 불편함을 하나씩 없애다 보니 우리집 레시피가 됐어요.")
                    .font(.suit(14)).lineSpacing(4).padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard()
            }

            VStack(alignment: .leading, spacing: 8) {
                SectionLabel("이런 게 좋아요")
                VStack(spacing: 0) {
                    ForEach(Array(features.enumerated()), id: \.offset) { i, f in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(f.0).font(.suit(15, .bold))
                            Text(f.1).font(.suit(13.5)).foregroundStyle(Theme.sub).lineSpacing(3)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 14)
                        if i < features.count - 1 { Divider().overlay(Theme.border) }
                    }
                }
                .padding(.horizontal, 16).paperCard()
            }
        }
    }
}

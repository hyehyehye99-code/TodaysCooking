import SwiftUI

// MARK: - 메뉴판 (모임·파티 때 만들 요리를 모아 두는 곳)

struct BoardIconView: View {
    let icon: BoardIcon
    var size: CGFloat = 52
    var body: some View {
        Circle().fill(Theme.surface).frame(width: size, height: size)
            .overlay {
                switch icon {
                case .emoji(let e): Text(e).font(.system(size: size * 0.5))
                case .mascot(let n): Image(n).resizable().scaledToFit().frame(width: size * 0.78, height: size * 0.78)
                }
            }
    }
}

private let koDate: (Date) -> String = { $0.formatted(.dateTime.year().month().day().locale(Locale(identifier: "ko_KR"))) }

// MARK: 목록

struct MealboardListPage: View {
    @Environment(Store.self) private var store

    var body: some View {
        SubPage(title: "메뉴판") {
            if store.mealboards.isEmpty {
                VStack(spacing: 10) {
                    MascotImage(name: "idea", size: 110)
                    Text("아직 메뉴판이 없어요.").font(.suit(15, .semibold))
                    Text("모임이나 파티 때 만들 요리를 모아\n메뉴판을 만들어보세요.")
                        .font(.suit(13)).foregroundStyle(Theme.sub).multilineTextAlignment(.center)
                    NavigationLink(value: MyRoute.mealboardForm(nil)) { newButton }.buttonStyle(PressStyle()).padding(.top, 8)
                }
                .frame(maxWidth: .infinity).padding(.top, 36)
            } else {
                HStack {
                    Text("메뉴판 \(store.mealboards.count)개").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                    Spacer()
                    NavigationLink(value: MyRoute.mealboardForm(nil)) {
                        Text("+ 새 메뉴판").font(.suit(14, .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 10).background(Theme.accent, in: Capsule())
                    }
                    .buttonStyle(PressStyle())
                }
                .padding(.horizontal, 4)
                VStack(spacing: 10) {
                    ForEach(store.mealboards.reversed()) { b in
                        NavigationLink(value: MyRoute.mealboardDetail(b.id)) { row(b) }.buttonStyle(PressStyle())
                    }
                }
            }
        }
    }

    private var newButton: some View {
        Text("+ 새 메뉴판").font(.suit(15, .bold)).foregroundStyle(.white)
            .padding(.horizontal, 24).padding(.vertical, 14).background(Theme.accent, in: Capsule())
    }

    private func row(_ b: Mealboard) -> some View {
        HStack(spacing: 12) {
            BoardIconView(icon: b.icon)
            VStack(alignment: .leading, spacing: 3) {
                Text(b.title).font(.suit(16, .bold)).foregroundStyle(Theme.ink)
                Text(["레시피 \(b.recipeIds.count)개", b.date.map(koDate)].compactMap { $0 }.joined(separator: " · "))
                    .font(.suit(12.5)).foregroundStyle(Theme.sub)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint)
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading).paperCard()
    }
}

// MARK: 새 메뉴판 / 메뉴판 수정 (전체 페이지)

struct MealboardFormPage: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    /// nil이면 새 메뉴판
    let editingId: UUID?

    @State private var title = ""
    @State private var icon: BoardIcon = .emoji("🎉")
    @State private var hasDate = false
    @State private var date = Date()
    @State private var headcount = ""
    @State private var picked: [String] = []
    @State private var error: String?
    @State private var askLeave = false
    @State private var loaded = false
    @FocusState private var titleFocused: Bool

    private let emojis = ["🎉", "🍽️", "🎂", "🍲", "🥂", "🏕️", "🍕", "🥗", "🍖", "🍰"]
    private let mascots = ["chef-greeting", "happy", "excited", "cooking", "idea", "thumbs-up"]

    private var dirty: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty || !picked.isEmpty || hasDate || !headcount.isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    field("메뉴판 이름") {
                        TextField("예: 홈파티 메뉴", text: $title).font(.suit(16)).focused($titleFocused)
                            .padding(.horizontal, 16).frame(height: 54).paperCard(radius: 18)
                    }

                    card("아이콘") { iconPicker }

                    HStack(alignment: .top, spacing: 10) {
                        card("날짜") { dateField }
                        card("인원수") {
                            HStack(spacing: 4) {
                                TextField("-", text: $headcount).font(.suit(16)).keyboardType(.numberPad)
                                    .onChange(of: headcount) { _, v in headcount = String(v.filter(\.isNumber).prefix(3)) }
                                Text("명").font(.suit(14)).foregroundStyle(Theme.sub)
                            }
                            .padding(.horizontal, 14).frame(height: 44)
                            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }

                    card("레시피 고르기", trailing: picked.isEmpty ? nil : "\(picked.count)개 선택") { recipePicker }
                }
                .padding(.horizontal, 16).padding(.bottom, 20)
            }
            .scrollDismissesKeyboard(.interactively)

            VStack(spacing: 6) {
                if let error { Text(error).font(.suit(12.5, .semibold)).foregroundStyle(Theme.warn) }
                PrimaryButton(title: editingId == nil ? "메뉴판 만들기" : "저장", action: save)
            }
            .padding(.horizontal, 16).padding(.top, 10).padding(.bottom, 8)
            .background(Theme.background)
            .overlay(alignment: .top) { Divider().overlay(Theme.border) }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
        .alert("지금 나가면 입력한 내용이 모두 사라져요", isPresented: $askLeave) {
            Button("취소", role: .cancel) {}
            Button("나가기", role: .destructive) { dismiss() }
        } message: { Text("계속하시겠어요?") }
        .onAppear(perform: load)
    }

    // MARK: 조각

    private var header: some View {
        HStack(spacing: 10) {
            Button { if dirty && editingId == nil { askLeave = true } else { dismiss() } } label: {
                Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
            Text(editingId == nil ? "새 메뉴판" : "메뉴판 수정").font(.suit(24, .bold)).tracking(-0.4)
            Spacer()
        }
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 12)
    }

    private func field<C: View>(_ label: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.suit(13, .bold)).padding(.horizontal, 4)
            content()
        }
    }

    private func card<C: View>(_ label: String, trailing: String? = nil, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(label).font(.suit(15, .bold))
                Spacer()
                if let trailing { Text(trailing).font(.suit(12.5, .semibold)).foregroundStyle(Theme.accent) }
            }
            content()
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard(radius: 22)
    }

    private var iconPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            FlowLayout(spacing: 8) { ForEach(emojis, id: \.self) { iconButton(.emoji($0)) } }
            FlowLayout(spacing: 8) { ForEach(mascots, id: \.self) { iconButton(.mascot($0)) } }
        }
    }

    private func iconButton(_ i: BoardIcon) -> some View {
        Button { icon = i } label: {
            BoardIconView(icon: i, size: 46)
                .overlay(Circle().strokeBorder(icon == i ? Theme.accent : .clear, lineWidth: 2.5))
        }
        .buttonStyle(PressStyle())
    }

    @ViewBuilder
    private var dateField: some View {
        if hasDate {
            VStack(alignment: .leading, spacing: 6) {
                DatePicker("날짜", selection: $date, displayedComponents: .date)
                    .labelsHidden().datePickerStyle(.compact).environment(\.locale, Locale(identifier: "ko_KR")).tint(Theme.accent)
                Button("날짜 지우기") { hasDate = false }.font(.suit(12, .semibold)).foregroundStyle(Theme.sub)
            }
        } else {
            Button { hasDate = true } label: {
                HStack {
                    Image(systemName: "calendar").font(.system(size: 13))
                    Text("선택 안 함").font(.suit(14))
                }
                .foregroundStyle(Theme.sub).padding(.horizontal, 12).frame(height: 44).frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(PressStyle())
        }
    }

    @ViewBuilder
    private var recipePicker: some View {
        if store.savedRecipes.isEmpty {
            Text("아직 등록된 레시피가 없어요. 레시피 탭에서 먼저 등록해주세요.")
                .font(.suit(13.5)).foregroundStyle(Theme.sub).lineSpacing(3)
        } else {
            VStack(spacing: 0) {
                ForEach(Array(store.savedRecipes.enumerated()), id: \.element.id) { i, r in
                    Button {
                        if let k = picked.firstIndex(of: r.id) { picked.remove(at: k) } else { picked.append(r.id) }
                    } label: {
                        HStack(spacing: 12) {
                            RecipeThumb(recipe: r, size: 46)
                            Text(r.displayTitle).font(.suit(15, .semibold)).foregroundStyle(Theme.ink).lineLimit(2).multilineTextAlignment(.leading)
                            Spacer(minLength: 6)
                            Circle().strokeBorder(picked.contains(r.id) ? Theme.accent : Color(hex: 0xD3D6DB), lineWidth: 1.6)
                                .background(Circle().fill(picked.contains(r.id) ? Theme.accent : .white))
                                .frame(width: 24, height: 24)
                                .overlay { if picked.contains(r.id) { Image(systemName: "checkmark").font(.system(size: 11, weight: .black)).foregroundStyle(.white) } }
                        }
                        .padding(.vertical, 8).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if i < store.savedRecipes.count - 1 { Divider().overlay(Theme.border) }
                }
            }
        }
    }

    // MARK: 동작

    private func load() {
        guard !loaded else { return }
        loaded = true
        guard let id = editingId, let b = store.mealboards.first(where: { $0.id == id }) else { return }
        title = b.title; icon = b.icon; picked = b.recipeIds
        if let d = b.date { hasDate = true; date = d }
        headcount = b.headcount.map(String.init) ?? ""
    }

    private func save() {
        if store.saveMealboard(editing: editingId, title: title, icon: icon, date: hasDate ? date : nil,
                               headcount: Int(headcount), recipeIds: picked) {
            dismiss()
        } else {
            error = "메뉴판 이름을 입력해주세요."
            titleFocused = true
        }
    }
}

// MARK: 상세

struct MealboardDetailPage: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let boardId: UUID
    @State private var askDelete = false
    @State private var showCard = false

    var body: some View {
        Group {
            if let b = store.mealboards.first(where: { $0.id == boardId }) {
                let recipes = b.recipeIds.compactMap { store.recipe($0) }
                VStack(spacing: 0) {
                    header(b)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            info(b, count: recipes.count)
                            if recipes.isEmpty {
                                Text("담긴 레시피가 없어요. 수정에서 레시피를 골라보세요.")
                                    .font(.suit(13.5)).foregroundStyle(Theme.sub).frame(maxWidth: .infinity).padding(.top, 24)
                            } else {
                                VStack(spacing: 0) {
                                    ForEach(Array(recipes.enumerated()), id: \.element.id) { i, r in
                                        NavigationLink(value: MyRoute.recipe(r.id)) { recipeRow(r) }.buttonStyle(.plain)
                                        if i < recipes.count - 1 { Divider().overlay(Theme.border) }
                                    }
                                }
                                .padding(.horizontal, 16).paperCard()
                            }
                        }
                        .padding(.horizontal, 16).padding(.bottom, 20)
                    }
                    bottomBar(b, hasRecipes: !recipes.isEmpty)
                }
                .sheet(isPresented: $showCard) { MealboardCardSheet(original: cardData(b), shareTitle: b.title) }
                .task {
                    #if DEBUG
                    if UserDefaults.standard.bool(forKey: "boardcard") { try? await Task.sleep(for: .seconds(1.2)); showCard = true }
                    #endif
                }
                .confirmationDialog("메뉴판을 삭제할까요?", isPresented: $askDelete, titleVisibility: .visible) {
                    Button("메뉴판 삭제", role: .destructive) { store.deleteMealboard(b.id); dismiss() }
                    Button("취소", role: .cancel) {}
                } message: { Text("메뉴판만 삭제돼요. 담겨있던 레시피는 그대로 남아있어요.") }
            } else {
                Color.clear.onAppear { dismiss() }
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
    }

    private func header(_ b: Mealboard) -> some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
            BoardIconView(icon: b.icon, size: 44)
            Text(b.title).font(.suit(20, .bold)).tracking(-0.4).lineLimit(2)
            Spacer(minLength: 4)
            Menu {
                NavigationLink(value: MyRoute.mealboardForm(b.id)) { Label("수정하기", systemImage: "pencil") }
                Button("메뉴판 삭제", systemImage: "trash", role: .destructive) { askDelete = true }
            } label: {
                Image(systemName: "ellipsis").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.sub)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .accessibilityLabel("더보기")
        }
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 14)
    }

    private func info(_ b: Mealboard, count: Int) -> some View {
        VStack(spacing: 8) {
            infoRow("레시피", "\(count)개")
            if let d = b.date { infoRow("날짜", koDate(d)) }
            if let n = b.headcount { infoRow("인원 수", "\(n)명") }
        }
        .padding(16).frame(maxWidth: .infinity).background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func infoRow(_ l: String, _ v: String) -> some View {
        HStack { Text(l).foregroundStyle(Theme.sub); Spacer(); Text(v).font(.suit(14, .semibold)) }.font(.suit(14))
    }

    private func recipeRow(_ r: Recipe) -> some View {
        HStack(spacing: 12) {
            RecipeThumb(recipe: r, size: 50)
            VStack(alignment: .leading, spacing: 3) {
                Text(r.displayTitle).font(.suit(15, .bold)).foregroundStyle(Theme.ink).lineLimit(2).multilineTextAlignment(.leading)
                if let t = r.tags.first, !r.title.isEmpty { Text("#\(t)").font(.suit(11.5, .bold)).foregroundStyle(Theme.accent) }
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.faint)
        }
        .padding(.vertical, 10).contentShape(Rectangle())
    }

    /// 웹과 같은 "메뉴판 만들기": 카드 이미지를 만들어 저장하거나 공유한다
    private func bottomBar(_ b: Mealboard, hasRecipes: Bool) -> some View {
        PrimaryButton(title: "메뉴판 만들기", disabled: !hasRecipes) { showCard = true }
            .padding(.horizontal, 16).padding(.top, 10).padding(.bottom, 8)
            .background(Theme.background)
            .overlay(alignment: .top) { Divider().overlay(Theme.border) }
    }

    private func cardData(_ b: Mealboard) -> MealboardCardData {
        MealboardCardData(
            householdName: store.kitchenName,
            title: b.title,
            recipes: b.recipeIds.compactMap { store.recipe($0) }.map {
                CardRecipe(title: $0.displayTitle, ingredientsText: $0.ings.map(\.name).joined(separator: ", "))
            })
    }
}

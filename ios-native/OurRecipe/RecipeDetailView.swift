import SwiftUI

// MARK: - 레시피 상세 (전체 페이지)

struct RecipeDetailView: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let recipeId: String
    /// 수정 화면을 여는 방법. 기본은 레시피 탭의 화면 스택, 마이페이지에서 열었을 땐 그쪽 스택에 쌓는다
    var onEdit: ((String) -> Void)? = nil
    @State private var askDelete = false
    @State private var propose = false

    var body: some View {
        Group {
            if let r = store.recipe(recipeId) {
                let active = r.ings.filter { !r.skipped.contains($0.name) }
                let have = active.filter { store.inFridge($0.name) }
                let lack = store.missing(r).filter { i in !store.shop.contains { $0.name == i.name } }
                VStack(spacing: 0) {
                    header(r)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            HStack(spacing: 6) {
                                Image("tool-recipebook").resizable().scaledToFit().frame(width: 18, height: 18)
                                Text("\(r.author)셰프 등록").font(.suit(13, .semibold)).foregroundStyle(Theme.accent)
                            }

                            if let link = r.link { linkCard(r, link) }

                            if !r.ings.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                                        Text("재료").font(.suit(16, .bold))
                                        if !r.hideIngredients {
                                            Text("\(have.count)/\(active.count) 보유 중").font(.suit(13)).foregroundStyle(Theme.sub)
                                        }
                                    }
                                    FlowLayout(spacing: 8) {
                                        ForEach(r.ings, id: \.self) { i in ingredientChip(i, r) }
                                    }
                                    if !r.hideIngredients && !lack.isEmpty {
                                        Button { store.addMissing(r) } label: {
                                            HStack(spacing: 6) {
                                                Image(systemName: "bag").font(.system(size: 14, weight: .semibold))
                                                Text("부족한 재료 장보기 담기 (\(lack.count))").font(.suit(14.5, .bold))
                                            }
                                            .foregroundStyle(Theme.accent).frame(maxWidth: .infinity).padding(.vertical, 14)
                                            .background(Theme.accentSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                                        }
                                        .buttonStyle(PressStyle()).padding(.top, 2)
                                    }
                                }
                            }

                            if !r.steps.isEmpty { stepsSection(r) }

                        }
                        .padding(.horizontal, 20).padding(.bottom, 28)
                    }
                }
                // 스크롤과 상관없이 항상 보이는 하단 고정 버튼: 가족이 함께 보는 메인 대화방으로 제안한다
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    VStack(spacing: 0) {
                        Divider().overlay(Theme.border)
                        Button { propose = true } label: {
                            HStack(spacing: 8) {
                                Image("cooking").resizable().scaledToFit().frame(width: 30, height: 30)
                                Text("가족에게 요리 제안하기").font(.suit(16, .bold)).foregroundStyle(.white)
                            }
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .background(Theme.accent, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .buttonStyle(PressStyle())
                        .padding(.horizontal, 16).padding(.top, 10).padding(.bottom, 8)
                    }
                    .background(Theme.background)
                }
                .sheet(isPresented: $propose) {
                    ProposeSheet(recipe: r) { note in store.proposeRecipe(r.id, note: note) }
                }
                .confirmationDialog("이 메뉴를 삭제할까요?", isPresented: $askDelete, titleVisibility: .visible) {
                    Button("삭제", role: .destructive) { store.deleteRecipe(r.id) }
                    Button("취소", role: .cancel) {}
                } message: { Text("삭제하면 되돌릴 수 없어요. 재료와 메모도 함께 사라져요.") }
            } else {
                Color.clear.onAppear { dismiss() }
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
        #if DEBUG
        .onAppear { if UserDefaults.standard.bool(forKey: "proposesheet") { propose = true } }
        #endif
    }

    private func header(_ r: Recipe) -> some View {
        HStack(spacing: 10) {
            roundButton("chevron.left", tint: Theme.ink, label: "뒤로") { dismiss() }
            Circle().fill(Theme.surface).frame(width: 44, height: 44)
                .overlay(Image("reading-recipe").resizable().scaledToFit().frame(width: 38, height: 38))
            Text(r.displayTitle).font(.suit(20, .bold)).tracking(-0.4).foregroundStyle(Theme.ink).lineLimit(2)
            Spacer(minLength: 4)
            roundButton(r.fav ? "star.fill" : "star", tint: r.fav ? Theme.positive : Theme.sub, label: "즐겨찾기") { store.toggleFav(r.id) }
            Menu {
                Button("수정", systemImage: "pencil") { if let onEdit { onEdit(r.id) } else { store.recipePath.append(.form(r.id)) } }
                Button("삭제", systemImage: "trash", role: .destructive) { askDelete = true }
            } label: {
                Image(systemName: "ellipsis").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.sub)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .accessibilityLabel("더보기")
        }
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 14)
    }

    private func roundButton(_ icon: String, tint: Color, label: String, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            Image(systemName: icon).font(.system(size: 14, weight: .bold)).foregroundStyle(tint)
                .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
        }
        .buttonStyle(PressStyle()).accessibilityLabel(label)
    }

    private func linkCard(_ r: Recipe, _ link: String) -> some View {
        let content = HStack(spacing: 12) {
            RecipeThumb(recipe: r, size: 68)
            VStack(alignment: .leading, spacing: 4) {
                Text(r.linkTitle ?? link).font(.suit(14, .semibold)).foregroundStyle(Theme.ink).lineLimit(3).multilineTextAlignment(.leading)
                if let host = r.host { Text(host).font(.suit(12.5)).foregroundStyle(Theme.faint) }
            }
            Spacer(minLength: 0)
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading).paperCard()
        return Group {
            if let url = URL(string: link) { Link(destination: url) { content } } else { content }
        }
    }

    /// 보유 중(주황 ✓) · 장보기에 담김(노랑) · 생략(회색 취소선) · 부족(흰색). 누르면 상태를 고른다
    @ViewBuilder
    private func ingredientChip(_ i: Ingredient, _ r: Recipe) -> some View {
        let skipped = !r.hideIngredients && r.skipped.contains(i.name)
        let inShop = !r.hideIngredients && !skipped && store.shop.contains { $0.name == i.name }
        let isHave = !r.hideIngredients && !skipped && !inShop && store.inFridge(i.name)
        let filled = isHave || inShop
        let chip = HStack(spacing: 5) {
            if isHave { Image(systemName: "checkmark").font(.system(size: 11, weight: .heavy)) }
            if inShop { Image(systemName: "bag.fill").font(.system(size: 11)) }
            Text(i.name).font(.suit(14, .semibold)).strikethrough(skipped)
            if !i.amt.isEmpty { Text(i.amt).font(.suit(14)).strikethrough(skipped).opacity(filled ? 0.85 : 1).foregroundStyle(filled ? .white : Theme.faint) }
            if skipped { Text("생략").font(.suit(11, .bold)).foregroundStyle(Theme.sub) }
        }
        .padding(.horizontal, 14).padding(.vertical, 9)
        .foregroundStyle(filled ? .white : skipped ? Theme.faint : Theme.sub)
        .background(isHave ? Theme.accent : inShop ? Theme.positive : skipped ? Theme.surface : Theme.card, in: Capsule())
        .overlay(Capsule().strokeBorder(filled || skipped ? .clear : Theme.border, lineWidth: 1))

        if r.hideIngredients {
            chip
        } else {
            // 기존 앱처럼 그냥 눌러서 상태를 바꾼다
            Button { store.cycleIngredient(i, in: r.id) } label: { chip }
                .buttonStyle(PressStyle())
                .sensoryFeedback(.selection, trigger: "\(skipped)\(inShop)\(isHave)")
                .accessibilityHint("누르면 구매 필요, 보유 중, 생략 순서로 바뀌어요")
        }
    }

    private func stepsSection(_ r: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("만드는법").font(.suit(16, .bold))
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(r.steps.enumerated()), id: \.offset) { i, st in
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(i + 1). \(st.text)").font(.suit(15)).lineSpacing(4).foregroundStyle(Theme.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        if let t = st.timer {
                            Button { store.startTimer(sec: t, label: timerLabel(t)) } label: {
                                HStack(spacing: 5) {
                                    Image("tool-timer").resizable().scaledToFit().frame(width: 18, height: 18)
                                    Text("\(timerLabel(t)) 타이머").font(.suit(12.5, .bold))
                                }
                                .foregroundStyle(Theme.accent).padding(.horizontal, 10).padding(.vertical, 6)
                                .background(Theme.accentSoft, in: Capsule())
                            }
                            .buttonStyle(PressStyle())
                        }
                    }
                }
            }
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
    }
}

// MARK: - 요리 제안하기 (메인 대화방에 올라가 가족도 함께 본다)

struct ProposeSheet: View {
    @Environment(\.dismiss) private var dismiss
    let recipe: Recipe
    let send: (String) -> Void
    @State private var note = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("가족에게 요리 제안하기").font(.suit(20, .bold)).tracking(-0.3)
            HStack(spacing: 12) {
                RecipeThumb(recipe: recipe, size: 52)
                Text(recipe.displayTitle).font(.suit(16, .bold)).lineLimit(2)
                Spacer(minLength: 0)
            }
            .padding(12).paperCard()
            TextField("한마디 남기기 (선택) 예) 오늘 저녁 이거 어때?", text: $note, axis: .vertical)
                .font(.suit(16)).lineLimit(1...3)
                .padding(.horizontal, 16).padding(.vertical, 14)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            HStack(spacing: 6) {
                Image(systemName: "person.2.fill").font(.system(size: 11)).foregroundStyle(Theme.faint)
                Text("메인 대화방에 올라가고, 가족도 함께 볼 수 있어요").font(.suit(12.5)).foregroundStyle(Theme.sub)
            }
            PrimaryButton(title: "대화방에 제안하기") { send(note); dismiss() }
        }
        .padding(.horizontal, 20).padding(.top, 22).padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        // 시트 자체의 배경을 흰색으로: 내용 뒤에만 칠하면 위아래로 시스템 회색이 비친다
        .presentationBackground(Theme.background)
        .presentationDetents([.height(360)])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(28)
    }
}

// MARK: - 새 메뉴 / 메뉴 수정

struct NewRecipeView: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    /// nil이면 새 메뉴, 아니면 수정할 레시피 id
    let editingId: String?

    @State private var title = ""
    @State private var link = ""
    @State private var ings = ""
    @State private var steps = ""
    @State private var hide = false
    @State private var linkTitle: String?
    @State private var loaded = false
    @State private var ai: AIState = .idle
    @State private var error: String?

    private enum AIState { case idle, loading, done }
    private var editing: String? { editingId }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                        .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
                }
                .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
                Text(editing == nil ? "새 메뉴" : "메뉴 수정").font(.suit(24, .bold)).tracking(-0.4)
                Spacer()
            }
            .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 12)

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 4) {
                            Text("요리 이름").font(.suit(13, .bold))
                        }
                        .padding(.horizontal, 4)
                        TextField("요리 이름 (링크만 저장하려면 비워두세요)", text: $title)
                            .font(.suit(16)).padding(.horizontal, 16).frame(height: 54).paperCard(radius: 18)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("참고 링크").font(.suit(15, .bold))
                        Text("AI 자동 정리는 유튜브·인스타그램 링크를 지원해요").font(.suit(12.5)).foregroundStyle(Theme.sub)
                        HStack(spacing: 8) {
                            TextField("https://...", text: $link).font(.suit(16))
                                .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                            // 시스템 붙여넣기 버튼: iOS 붙여넣기 허용 알림 없이 바로 붙여넣는다
                            PasteButton(payloadType: String.self) { strings in
                                if let first = strings.first { link = first }
                            }
                            .labelStyle(.titleOnly).buttonBorderShape(.capsule).tint(Theme.accent)
                        }
                        .padding(.horizontal, 16).frame(height: 50)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        Button(action: runAI) {
                            HStack(spacing: 6) {
                                if ai == .done { Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)) }
                                else { Image("tab-assistant").renderingMode(.template).resizable().scaledToFit().frame(width: 17, height: 17) }
                                Text(ai == .loading ? "AI가 작성하는 중..." : ai == .done ? "AI가 작성했어요" : "AI로 재료·레시피 자동 작성")
                                    .font(.suit(14, .bold))
                            }
                            .foregroundStyle(Theme.accent).frame(maxWidth: .infinity).padding(.vertical, 13)
                            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.accent, lineWidth: 1.2))
                        }
                        .buttonStyle(PressStyle()).disabled(ai == .loading)
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard(radius: 22)

                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("재료").font(.suit(15, .bold))
                            Spacer()
                            Button { hide.toggle() } label: {
                                HStack(spacing: 6) {
                                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                                        .strokeBorder(hide ? Theme.accent : Color(hex: 0xC9CDD3), lineWidth: 1.5)
                                        .background(RoundedRectangle(cornerRadius: 6).fill(hide ? Theme.accent : .white))
                                        .frame(width: 20, height: 20)
                                        .overlay { if hide { Image(systemName: "checkmark").font(.system(size: 10, weight: .black)).foregroundStyle(.white) } }
                                    Text("재료·만들 수 있어요 표시 안 함").font(.suit(12.5)).foregroundStyle(Theme.sub)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                        Text("한 줄에 하나씩 입력해주세요").font(.suit(12.5)).foregroundStyle(Theme.sub)
                        editor($ings, placeholder: "김치\n돼지고기\n두부\n대파\n마늘\n고추장", minHeight: 190)
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard(radius: 22)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("만드는법").font(.suit(15, .bold))
                        editor($steps, placeholder: "예) 다음엔 국물을 더 자작하게, 마늘은 좀 줄이기", minHeight: 150)
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading).paperCard(radius: 22)
                }
                .padding(.horizontal, 16).padding(.bottom, 20)
            }
            .scrollDismissesKeyboard(.interactively)

            VStack(spacing: 6) {
                if let error { Text(error).font(.suit(12.5, .semibold)).foregroundStyle(Theme.warn) }
                PrimaryButton(title: "메뉴 저장", action: save)
            }
            .padding(.horizontal, 16).padding(.top, 10).padding(.bottom, 8)
            .background(Theme.background)
            .overlay(alignment: .top) { Divider().overlay(Theme.border) }
        }
        .background(Theme.background.ignoresSafeArea())
        .onAppear(perform: load)
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
    }

    private func editor(_ text: Binding<String>, placeholder: String, minHeight: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            TextEditor(text: text).font(.suit(16)).scrollContentBackground(.hidden)
                .padding(.horizontal, 10).padding(.vertical, 8).frame(minHeight: minHeight)
            if text.wrappedValue.isEmpty {
                Text(placeholder).font(.suit(16)).foregroundStyle(Theme.faint)
                    .padding(.horizontal, 15).padding(.vertical, 16).allowsHitTesting(false)
            }
        }
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func load() {
        guard !loaded else { return }
        loaded = true
        guard let id = editing, let r = store.recipe(id) else { return }
        title = r.title
        link = r.link ?? ""
        linkTitle = r.linkTitle
        ings = r.ings.map { $0.amt.isEmpty ? $0.name : "\($0.name) \($0.amt)" }.joined(separator: "\n")
        steps = r.steps.enumerated().map { "\($0.offset + 1). \($0.element.text)" }.joined(separator: "\n")
        hide = r.hideIngredients
    }

    /// 서버의 AI 가 링크를 분석해 레시피북에 바로 저장한다 (로그인 필요, 유튜브·인스타그램 링크)
    private func runAI() {
        let l = link.trimmingCharacters(in: .whitespaces)
        guard !l.isEmpty else { store.showToast("링크를 먼저 넣어주세요"); return }
        guard l.contains("youtube.com") || l.contains("youtu.be") || l.contains("instagram.com") else {
            store.showToast("AI 자동 작성은 유튜브·인스타그램 링크에서만 쓸 수 있어요")
            return
        }
        ai = .loading
        Task {
            let saved = await store.aiSaveLink(l)
            ai = saved ? .done : .idle
            if saved { dismiss() }
        }
    }

    private func save() {
        if store.saveRecipe(editing: editing, title: title, link: link, ings: ings, steps: steps, hide: hide, linkTitle: linkTitle) {
            dismiss()
        } else {
            error = "요리 이름이나 링크를 입력해주세요."
        }
    }
}

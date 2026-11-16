import SwiftUI

struct SearchField: View {
    @Binding var text: String
    let prompt: String
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").font(.system(size: 15, weight: .medium)).foregroundStyle(Theme.faint)
            TextField(prompt, text: $text).font(.suit(16)).submitLabel(.search)
        }
        .padding(.horizontal, 14).frame(height: 46)
        .background(Theme.surface, in: Capsule())
    }
}

/// 레시피 필터 칩 (선택 시 주황 채움 / 기본은 흰색 + 얇은 테두리)
struct FilterChip: View {
    let label: String
    var systemImage: String? = nil
    var chevron = false
    var on = false
    var body: some View {
        HStack(spacing: 5) {
            if let systemImage { Image(systemName: systemImage).font(.system(size: 11, weight: .bold)) }
            Text(label).font(.suit(13.5, .semibold)).lineLimit(1)
            if chevron { Image(systemName: "chevron.down").font(.system(size: 10, weight: .bold)) }
        }
        .padding(.horizontal, 13).padding(.vertical, 8)
        .foregroundStyle(on ? .white : Theme.sub)
        .background(on ? Theme.accent : Theme.surface, in: Capsule())
    }
}

/// 레시피 썸네일 (서버에 사진이 있으면 사진, 없으면 마스코트 음식 그림. 링크가 있으면 재생 아이콘)
struct RecipeThumb: View {
    let recipe: Recipe
    var size: CGFloat = 56

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.24, style: .continuous).fill(recipe.tint).frame(width: size, height: size)
            .overlay {
                if let s = recipe.photoURL, let url = URL(string: s) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image): image.resizable().scaledToFill()
                        default: fallback
                        }
                    }
                    .frame(width: size, height: size)
                    .clipShape(RoundedRectangle(cornerRadius: size * 0.24, style: .continuous))
                } else {
                    fallback
                }
            }
            .overlay {
                if recipe.link != nil {
                    Circle().fill(.black.opacity(0.45)).frame(width: size * 0.38, height: size * 0.38)
                        .overlay(Image(systemName: "play.fill").font(.system(size: size * 0.15)).foregroundStyle(.white))
                }
            }
    }

    private var fallback: some View {
        Image(recipe.photo).resizable().scaledToFit().frame(width: size * 0.72, height: size * 0.72)
    }
}

struct RecipesView: View {
    @Environment(Store.self) private var store
    private enum Quick { case all, fav, makeable, linkOnly }
    private enum Sort: String, CaseIterable { case newest = "최신순", name = "이름순" }

    @State private var query = ""
    @State private var quick: Quick = .all
    @State private var tag: String?
    @State private var sort: Sort = .newest

    private var allTags: [String] { Array(Set(store.savedRecipes.flatMap(\.tags))).sorted() }

    private func makeable(_ r: Recipe) -> Bool { !r.hideIngredients && !r.ings.isEmpty && store.missing(r).isEmpty }

    private var list: [Recipe] {
        let q = query.trimmingCharacters(in: .whitespaces)
        var items = store.savedRecipes.filter { r in
            let okQuick: Bool
            switch quick {
            case .all: okQuick = true
            case .fav: okQuick = r.fav
            case .makeable: okQuick = makeable(r)
            case .linkOnly: okQuick = r.isLinkOnly
            }
            let okTag = tag == nil || r.tags.contains(tag!)
            let okQuery = q.isEmpty || r.title.contains(q) || (r.linkTitle ?? "").contains(q) || r.ings.contains { $0.name.contains(q) }
            return okQuick && okTag && okQuery
        }
        switch sort {
        case .newest: break   // 서버/저장 순서가 이미 최신순이다
        case .name: items.sort { $0.displayTitle < $1.displayTitle }
        }
        return items
    }

    var body: some View {
        @Bindable var store = store
        NavigationStack(path: $store.recipePath) {
            listPage
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: RecipeRoute.self) { route in
                    switch route {
                    case .detail(let id): RecipeDetailView(recipeId: id)
                    case .form(let id): NewRecipeView(editingId: id.isEmpty ? nil : id)
                    }
                }
        }
    }

    private var listPage: some View {
        Screen {
            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 10) {
                            SearchField(text: $query, prompt: "메뉴, 재료 검색")
                            Menu {
                                Picker("정렬", selection: $sort) { ForEach(Sort.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                            } label: {
                                Image(systemName: "line.3.horizontal.decrease").font(.system(size: 15, weight: .medium)).foregroundStyle(Theme.sub)
                                    .frame(width: 46, height: 46).background(Theme.card, in: Circle())
                                    .overlay(Circle().strokeBorder(Theme.border, lineWidth: 1))
                            }
                            .accessibilityLabel("정렬")
                        }
                        .padding(.horizontal, 16)

                        FlowLayout(spacing: 8) {
                            chip("전체", on: quick == .all && tag == nil) { quick = .all; tag = nil }
                            chip("즐겨찾기", icon: "star", on: quick == .fav) { quick = quick == .fav ? .all : .fav }
                            chip("바로 만들 수 있는 요리", icon: "checkmark", on: quick == .makeable) { quick = quick == .makeable ? .all : .makeable }
                            chip("링크만", icon: "link", on: quick == .linkOnly) { quick = quick == .linkOnly ? .all : .linkOnly }
                            Menu {
                                Button("전체 태그") { tag = nil }
                                ForEach(allTags, id: \.self) { c in Button("# \(c)") { tag = c } }
                            } label: {
                                FilterChip(label: tag.map { "# \($0)" } ?? "# 태그 \(allTags.count)", chevron: true, on: tag != nil)
                            }
                        }
                        .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 14)

                        Divider().overlay(Theme.border).padding(.horizontal, 16)
                        Text("레시피 \(list.count)개").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                            .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 10)

                        if list.isEmpty {
                            VStack(spacing: 8) {
                                MascotImage(name: "puzzled", size: 84)
                                Text(store.savedRecipes.isEmpty ? "아직 등록된 메뉴가 없어요." : "검색 결과가 없어요.").font(.suit(15, .semibold))
                                Text(store.savedRecipes.isEmpty ? "첫 메뉴를 등록해보세요." : "다른 메뉴나 재료로 찾아보세요.").font(.suit(13)).foregroundStyle(Theme.sub)
                            }
                            .frame(maxWidth: .infinity).padding(.top, 36)
                        } else {
                            LazyVStack(spacing: 10) {
                                ForEach(list) { r in
                                    Button { store.recipePath.append(.detail(r.id)) } label: { row(r) }.buttonStyle(PressStyle())
                                }
                            }
                            .padding(.horizontal, 16).padding(.bottom, 24)
                        }
                    }
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("레시피").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                Text(store.kitchenName).font(.suit(28, .bold)).tracking(-0.5).foregroundStyle(Theme.ink)
            }
            Spacer()
            Button { store.recipePath.append(.form("")) } label: {
                Text("+ 새 메뉴").font(.suit(15, .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 18).padding(.vertical, 12)
                    .background(Theme.accent, in: Capsule())
                    .shadow(color: Theme.accent.opacity(0.28), radius: 8, y: 4)
            }
            .buttonStyle(PressStyle())
        }
        .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 14)
    }

    private func chip(_ label: String, icon: String? = nil, on: Bool, run: @escaping () -> Void) -> some View {
        Button(action: run) { FilterChip(label: label, systemImage: icon, on: on) }.buttonStyle(PressStyle())
    }

    private func row(_ r: Recipe) -> some View {
        HStack(spacing: 12) {
            RecipeThumb(recipe: r)
            VStack(alignment: .leading, spacing: 3) {
                if r.title.isEmpty {
                    Text(r.displayTitle).font(.suit(14)).foregroundStyle(Theme.sub).lineLimit(3).multilineTextAlignment(.leading)
                    if let host = r.host { Text(host).font(.suit(12)).foregroundStyle(Theme.faint) }
                } else {
                    Text(r.title).font(.suit(16, .bold)).foregroundStyle(Theme.ink).lineLimit(2).multilineTextAlignment(.leading)
                    if makeable(r) {
                        Text("바로 만들 수 있어요").font(.suit(11.5, .bold)).foregroundStyle(Color(hex: 0x2E7D5B))
                    }
                }
            }
            Spacer(minLength: 8)
            Button { store.toggleFav(r.id) } label: {
                Image(systemName: r.fav ? "star.fill" : "star").font(.system(size: 17))
                    .foregroundStyle(r.fav ? Theme.positive : Theme.faint).frame(width: 34, height: 34)
            }
            .buttonStyle(.plain).accessibilityLabel("즐겨찾기")
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .paperCard()
    }
}

import Foundation

/// 서버의 date 컬럼("2026-11-20")과 Date 사이 변환 (시간대는 기기 기준)
enum DateOnly {
    private static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar(identifier: .gregorian)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static func parse(_ s: String?) -> Date? {
        guard let s, s.count >= 10 else { return nil }
        return formatter.date(from: String(s.prefix(10)))
    }

    static func string(_ d: Date) -> String { formatter.string(from: d) }
}

extension Recipe {
    /// 서버 레시피 → 화면 모델. 서버에는 만드는 법이 notes 한 덩어리라서 줄 단위로 단계를 만든다
    init(remote r: RemoteRecipe, authorName: String) {
        let ingredients = (r.recipe_ingredients ?? []).sorted { ($0.position ?? 0) < ($1.position ?? 0) }
        let bookmark = r.bookmarks?.first
        let id = r.id.lowercased()
        self.init(
            id: id,
            emoji: r.icon_emoji ?? "🍽️",
            photo: Recipe.fallbackPhotos[Recipe.stableIndex(id, Recipe.fallbackPhotos.count)],
            photoURL: r.cover_photo_urls?.first ?? bookmark?.thumbnail_url,
            title: r.title ?? "",
            sub: r.subtitle ?? "",
            tags: r.tags ?? [],
            time: r.cook_time_minutes.map { "\($0)분" } ?? "",
            serving: "",
            tintHex: Recipe.tints[Recipe.stableIndex(id, Recipe.tints.count)],
            ings: ingredients.map { Ingredient(name: $0.name, amt: $0.amount ?? "") },
            steps: Store.parseSteps(r.notes ?? ""),
            saved: true,
            fav: r.is_favorite ?? false,
            link: bookmark?.url,
            linkTitle: bookmark?.title ?? bookmark?.domain,
            author: authorName,
            hideIngredients: r.hide_ingredients ?? false,
            skipped: Set(ingredients.filter { $0.skipped == true }.map(\.name)))
    }

    /// 서버로 보내는 만드는 법 (notes). 단계마다 번호를 붙인다
    var notesText: String {
        steps.enumerated().map { "\($0.offset + 1). \($0.element.text)" }.joined(separator: "\n")
    }

    /// 서버와 맞춰야 하는 필드만 모은 값. 화면 전용 값(chipFridge 등)이 바뀌어도 전송하지 않기 위해 따로 비교한다
    struct SyncFields: Hashable {
        var emoji: String, title: String, sub: String, tags: [String], ings: [Ingredient], steps: [Step]
        var fav: Bool, link: String?, linkTitle: String?, hide: Bool, skipped: Set<String>

        var withoutFav: SyncFields { var c = self; c.fav = false; return c }
        var withoutFavAndSkipped: SyncFields { var c = withoutFav; c.skipped = []; return c }
    }

    var syncFields: SyncFields {
        SyncFields(emoji: emoji, title: title, sub: sub, tags: tags, ings: ings, steps: steps,
                   fav: fav, link: link, linkTitle: linkTitle, hide: hideIngredients, skipped: skipped)
    }
}

extension FridgeItem {
    init(remote r: RemoteFridgeItem) {
        self.init(name: r.name, amt: "", expiry: DateOnly.parse(r.consume_by) ?? DateOnly.parse(r.expires_on))
        if let u = UUID(uuidString: r.id) { id = u }
    }
}

extension ShopItem {
    init(remote r: RemoteShoppingItem) {
        self.init(id: UUID(uuidString: r.id) ?? UUID(), name: r.name, amt: "",
                  from: r.source_recipe_title ?? ShopItem.manual, checked: r.checked,
                  sourceRecipeId: r.source_recipe_id?.lowercased())
    }
}

extension Member {
    init(remote m: RemoteMember, myUserId: String) {
        let fallback = m.email?.split(separator: "@").first.map(String.init) ?? "참여자"
        let isMe = m.user_id == myUserId
        let name = (m.nickname?.isEmpty == false ? m.nickname : nil) ?? fallback
        self.init(userId: m.user_id, name: name, role: (m.role == "owner" ? "대장" : "참여자") + (isMe ? " (나)" : ""),
                  tintHex: Recipe.tints[Recipe.stableIndex(m.user_id, Recipe.tints.count)], isMe: isMe)
    }
}

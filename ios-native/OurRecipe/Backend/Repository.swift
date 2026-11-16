import Foundation

/// 테이블/RPC 호출을 모아 둔 곳. 웹의 서버 액션(src/lib/actions/*)이 하던 일을 앱이 사용자 JWT 로 직접 한다.
enum Repository {
    private static var db: Backend { .shared }

    // MARK: 우리집 (households)

    static func memberships(userId: String) async throws -> [RemoteMembership] {
        try await db.select("household_members", select: "role,households(id,name,invite_code)",
                            filters: ["user_id": "eq.\(userId)"], order: "joined_at.asc")
    }

    static func createHousehold(name: String) async throws -> String {
        try await db.rpc("create_household", ["household_name": .string(name)])
    }

    /// 초대 코드로 참여 → 참여한 우리집 id (코드가 틀리면 nil)
    static func joinHousehold(code: String) async throws -> String? {
        try await db.rpc("join_household_with_code", ["p_invite_code": .string(code)])
    }

    static func leaveHousehold(_ id: String) async throws {
        try await db.rpcVoid("leave_household", ["target_household_id": .string(id)])
    }

    static func removeMember(household: String, user: String) async throws {
        try await db.rpcVoid("remove_household_member", ["target_household_id": .string(household), "target_user_id": .string(user)])
    }

    static func renameHousehold(_ id: String, name: String) async throws {
        try await db.update("households", filters: ["id": "eq.\(id)"], values: ["name": .string(name)])
    }

    static func members(of household: String) async throws -> [RemoteMember] {
        try await db.rpc("get_household_members", ["target_household_id": .string(household)])
    }

    static func upsertProfile(nickname: String) async throws {
        try await db.rpcVoid("upsert_my_profile", ["new_nickname": .string(nickname), "new_icon_emoji": .null])
    }

    // MARK: 레시피

    static func recipes(household: String) async throws -> [RemoteRecipe] {
        try await db.select("recipes", select: RemoteRecipe.selectColumns, filters: ["household_id": "eq.\(household)"],
                            order: "position.asc.nullslast,created_at.desc")
    }

    private static func recipeRow(_ r: Recipe, household: String, user: String, position: Int?) -> [String: JSONValue] {
        var row: [String: JSONValue] = [
            "id": .string(r.id),
            "household_id": .string(household),
            "title": r.title.isEmpty ? .null : .string(r.title),
            "subtitle": r.sub.isEmpty ? .null : .string(r.sub),
            "tags": .array(r.tags.map(JSONValue.string)),
            "notes": r.notesText.isEmpty ? .null : .string(r.notesText),
            "icon_emoji": r.emoji == "🍽️" ? .null : .string(r.emoji),
            "hide_ingredients": .bool(r.hideIngredients),
            "is_favorite": .bool(r.fav),
            "created_by": .string(user),
        ]
        if let position { row["position"] = .int(position) }
        return row
    }

    private static func replaceIngredients(_ r: Recipe) async throws {
        try await db.delete("recipe_ingredients", filters: ["recipe_id": "eq.\(r.id)"])
        guard !r.ings.isEmpty else { return }
        let rows: [[String: JSONValue]] = r.ings.enumerated().map { i, ing in
            ["recipe_id": .string(r.id), "name": .string(ing.name), "amount": ing.amt.isEmpty ? .null : .string(ing.amt),
             "position": .int(i), "skipped": .bool(r.skipped.contains(ing.name))]
        }
        _ = try await db.insert("recipe_ingredients", rows: rows, select: "id") as [RemoteIdRow]
    }

    private static func syncBookmark(_ r: Recipe, household: String, user: String) async throws {
        let existing: [RemoteIdRow] = try await db.select("bookmarks", select: "id", filters: ["recipe_id": "eq.\(r.id)"], limit: 1)
        guard let link = r.link, !link.isEmpty else {
            if !existing.isEmpty { try await db.delete("bookmarks", filters: ["recipe_id": "eq.\(r.id)"]) }
            return
        }
        var values: [String: JSONValue] = ["url": .string(link), "title": r.linkTitle.json, "domain": r.host.json]
        if let thumb = SharedLink.thumbnailURL(for: link) { values["thumbnail_url"] = .string(thumb) }
        if let row = existing.first {
            try await db.update("bookmarks", filters: ["id": "eq.\(row.id)"], values: values)
        } else {
            var insert = values
            insert["household_id"] = .string(household); insert["recipe_id"] = .string(r.id); insert["created_by"] = .string(user)
            _ = try await db.insert("bookmarks", rows: [insert], select: "id") as [RemoteIdRow]
        }
    }

    static func createRecipe(_ r: Recipe, household: String, user: String, position: Int) async throws {
        _ = try await db.insert("recipes", rows: [recipeRow(r, household: household, user: user, position: position)], select: "id") as [RemoteIdRow]
        do {
            try await replaceIngredients(r)
            try await syncBookmark(r, household: household, user: user)
        } catch {
            try? await db.delete("recipes", filters: ["id": "eq.\(r.id)"])   // 반쪽만 저장되지 않게 되돌린다
            throw error
        }
    }

    static func updateRecipe(_ r: Recipe, household: String, user: String) async throws {
        var row = recipeRow(r, household: household, user: user, position: nil)
        row["id"] = nil; row["created_by"] = nil; row["household_id"] = nil
        try await db.update("recipes", filters: ["id": "eq.\(r.id)"], values: row)
        try await replaceIngredients(r)
        try await syncBookmark(r, household: household, user: user)
    }

    static func setFavorite(_ id: String, _ fav: Bool) async throws {
        try await db.update("recipes", filters: ["id": "eq.\(id)"], values: ["is_favorite": .bool(fav)])
    }

    static func setIngredientSkipped(recipe: String, name: String, skipped: Bool) async throws {
        try await db.update("recipe_ingredients", filters: ["recipe_id": "eq.\(recipe)", "name": "eq.\(name)"], values: ["skipped": .bool(skipped)])
    }

    static func deleteRecipe(_ id: String) async throws {
        try await db.delete("recipes", filters: ["id": "eq.\(id)"])
    }

    // MARK: 냉장고 (in_stock 이 true 인 것이 "보유중인 재료")

    static func fridge(household: String) async throws -> [RemoteFridgeItem] {
        try await db.select("fridge_items", select: "id,name,category,in_stock,expires_on,consume_by",
                            filters: ["household_id": "eq.\(household)", "in_stock": "eq.true"], order: "name.asc")
    }

    /// 넣기/날짜 수정. 서버에는 수량 칸이 없고, 날짜는 유통기한·소비기한에 같은 값을 쓴다. category 는 건드리지 않는다
    static func upsertFridge(_ item: FridgeItem, household: String) async throws {
        let date: JSONValue = item.expiry.map { .string(DateOnly.string($0)) } ?? .null
        _ = try await db.insert("fridge_items", rows: [[
            "household_id": .string(household), "name": .string(item.name), "in_stock": .bool(true),
            "expires_on": date, "consume_by": date,
        ]], select: "id", onConflict: "household_id,name") as [RemoteIdRow]
    }

    /// 빼기: 행을 지우지 않고 "없음"으로 바꾼다 (웹의 냉장고 목록과 같은 방식)
    static func removeFridge(name: String, household: String) async throws {
        try await db.update("fridge_items", filters: ["household_id": "eq.\(household)", "name": "eq.\(name)"],
                            values: ["in_stock": .bool(false)])
    }

    // MARK: 장보기

    static func shopping(household: String) async throws -> [RemoteShoppingItem] {
        try await db.select("shopping_items", select: "id,name,source_recipe_id,source_recipe_title,checked",
                            filters: ["household_id": "eq.\(household)"], order: "created_at.asc")
    }

    static func insertShopping(_ item: ShopItem, household: String) async throws {
        var row: [String: JSONValue] = ["id": .string(item.id.uuidString.lowercased()), "household_id": .string(household),
                                         "name": .string(item.name), "checked": .bool(item.checked)]
        if let rid = item.sourceRecipeId { row["source_recipe_id"] = .string(rid) }
        if item.from != ShopItem.manual { row["source_recipe_title"] = .string(item.from) }
        _ = try await db.insert("shopping_items", rows: [row], select: "id") as [RemoteIdRow]
    }

    static func setShoppingChecked(_ id: UUID, _ checked: Bool) async throws {
        try await db.update("shopping_items", filters: ["id": "eq.\(id.uuidString.lowercased())"], values: ["checked": .bool(checked)])
    }

    static func deleteShopping(_ id: UUID) async throws {
        try await db.delete("shopping_items", filters: ["id": "eq.\(id.uuidString.lowercased())"])
    }
}

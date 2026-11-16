import Foundation

// Supabase 테이블 행. 웹의 src/lib/types.ts 와 같은 컬럼을 그대로 따른다.

struct RemoteHousehold: Decodable, Equatable {
    let id: String
    let name: String
    let invite_code: String
}

/// household_members + households(id,name,invite_code) 조인 결과
struct RemoteMembership: Decodable {
    let role: String
    let households: RemoteHousehold?
}

struct RemoteIngredient: Decodable, Equatable {
    let id: String?
    let name: String
    let amount: String?
    let position: Int?
    let skipped: Bool?
}

struct RemoteBookmark: Decodable, Equatable {
    let url: String
    let title: String?
    let domain: String?
    let thumbnail_url: String?
}

struct RemoteRecipe: Decodable, Equatable {
    let id: String
    let household_id: String
    let title: String?
    let subtitle: String?
    let cook_time_minutes: Int?
    let cover_photo_urls: [String]?
    let icon_emoji: String?
    let tags: [String]?
    let notes: String?
    let position: Int?
    let is_favorite: Bool?
    let hide_ingredients: Bool?
    let created_by: String?
    let recipe_ingredients: [RemoteIngredient]?
    let bookmarks: [RemoteBookmark]?

    static let selectColumns =
        "id,household_id,title,subtitle,cook_time_minutes,cover_photo_urls,icon_emoji,tags,notes,position,is_favorite,hide_ingredients,created_by,"
        + "recipe_ingredients(id,name,amount,position,skipped),bookmarks(url,title,domain,thumbnail_url)"
}

struct RemoteFridgeItem: Decodable, Equatable {
    let id: String
    let name: String
    let category: String?
    let in_stock: Bool
    let expires_on: String?
    let consume_by: String?
}

struct RemoteShoppingItem: Decodable, Equatable {
    let id: String
    let name: String
    let source_recipe_id: String?
    let source_recipe_title: String?
    let checked: Bool
}

/// RPC get_household_members 의 반환 행
struct RemoteMember: Decodable, Equatable {
    let user_id: String
    let nickname: String?
    let icon_emoji: String?
    let email: String?
    let role: String
    let joined_at: String?
}

struct RemoteIdRow: Decodable { let id: String }

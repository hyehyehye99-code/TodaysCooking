import SwiftUI

enum RecipeCategory: String, CaseIterable, Identifiable {
    case korean = "한식", western = "양식", easy = "간편"
    var id: String { rawValue }
}

struct Ingredient: Hashable {
    let name: String
    let amt: String
}

struct Step: Hashable {
    let text: String
    var timer: Int? = nil
}

struct Recipe: Identifiable, Hashable {
    let id: String
    var emoji: String
    var photo: String
    var title: String
    var sub: String
    var cat: RecipeCategory
    var time: String
    var serving: String
    var tint: Color
    var ings: [Ingredient]
    var steps: [Step]
    var saved: Bool = true
    var fav = false
    /// 참고 링크(유튜브·인스타 등)와 그 링크의 제목
    var link: String? = nil
    var linkTitle: String? = nil
    var author = "영공"
    /// "재료·만들 수 있어요 표시 안 함"
    var hideIngredients = false
    /// 이 레시피에서 "생략"으로 표시한 재료 이름
    var skipped: Set<String> = []
    /// 재료 칩으로 "보유 중"을 눌러 냉장고에 넣은 재료 (되돌릴 때 같이 뺀다)
    var chipFridge: Set<String> = []

    /// 이름 없이 링크만 저장한 경우 링크 제목을 대신 보여 준다
    var displayTitle: String { title.isEmpty ? (linkTitle ?? "저장한 링크") : title }
    var host: String? {
        link.flatMap { URL(string: $0)?.host }?.replacingOccurrences(of: "www.", with: "")
    }
    var isLinkOnly: Bool { title.isEmpty && link != nil }
}

/// 레시피 탭 안에서 밀어서 들어가는 전체 페이지 (form의 id가 빈 문자열이면 새 메뉴)
enum RecipeRoute: Hashable {
    case detail(String)
    case form(String)
}

struct FridgeItem: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var amt: String
    /// 유통기한은 선택 사항이다 (nil = 기한 없음)
    var expiry: Date?

    init(name: String, amt: String, expiry: Date? = nil) {
        self.name = name; self.amt = amt; self.expiry = expiry
    }

    /// 오늘부터 며칠 뒤 (nil = 기한 없음)
    init(name: String, amt: String, days: Int?) {
        self.init(name: name, amt: amt, expiry: days.map { FridgeItem.date(afterDays: $0) })
    }

    static func date(afterDays n: Int) -> Date {
        let cal = Calendar.current
        return cal.date(byAdding: .day, value: n, to: cal.startOfDay(for: Date())) ?? Date()
    }

    /// 남은 일수: 3 → D-3, 0 → 오늘, 음수 → 기한 지남
    var days: Int? {
        guard let expiry else { return nil }
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: Date()), to: cal.startOfDay(for: expiry)).day
    }

    var ddayText: String? {
        guard let d = days else { return nil }
        return d < 0 ? "D+\(-d)" : d == 0 ? "D-DAY" : "D-\(d)"
    }

    /// D-2 이내(이미 지난 것 포함)면 곧 상한다고 본다
    var isSoon: Bool { (days ?? 99) <= 2 }
}

struct ShopItem: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let amt: String
    let from: String
    var checked = false
}

struct Member: Identifiable, Hashable {
    var id: String { name }
    var name: String
    let role: String
    let tint: Color
    var isMe = false
}

enum CardKind: Hashable {
    case recipe(String)
    case ings(String)
    case timer(label: String, sec: Int)
    case fridge
    case shop
}

struct Msg: Identifiable {
    let id = UUID()
    let fromMe: Bool
    var text: String? = nil
    var card: CardKind? = nil
    var mood = "chef-greeting"
    /// 내가 보낸 메시지를 가족이 봤다는 표시
    var seen: String? = nil
    /// 같은 주방 메이트가 보낸 메시지(이름). nil이면 나 또는 AI 셰프
    var mate: String? = nil
    /// 날짜/시간 구분선 문구
    var separator: String? = nil
}

enum AppTab: Hashable { case chat, recipes, shop, my }

/// 마이페이지 > 타이머에 저장해 둔 타이머
struct SavedTimer: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var sec: Int
}

enum MyRoute: Hashable {
    case profile, usage, mealboard, timers, fridge, account, tags, activity, about
    case mealboardForm(UUID?)      // nil이면 새 메뉴판, 아니면 수정할 메뉴판
    case mealboardDetail(UUID)
    /// 메뉴판에서 레시피를 눌렀을 때: 레시피 탭으로 건너가지 않고 이 화면 위에 쌓아서, 뒤로가기가 메뉴판으로 돌아온다
    case recipe(String)
    case recipeForm(String)
}

/// 메뉴판 아이콘: 이모지 또는 마스코트
enum BoardIcon: Hashable {
    case emoji(String)
    case mascot(String)
}

/// 모임·파티 때 만들 요리를 모아 둔 메뉴판
struct Mealboard: Identifiable, Hashable {
    let id = UUID()
    var title: String
    var icon: BoardIcon
    var date: Date?
    var headcount: Int?
    var recipeIds: [String]
}

/// 내가 속한 주방(우리집). 주방마다 이름과 참여자가 따로 있다
struct Kitchen: Identifiable {
    let id = UUID()
    var name: String
    var members: [Member]
}

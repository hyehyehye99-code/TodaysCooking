import SwiftUI

/// 프로필 아이콘. 웹과 같은 규칙으로 서버 profiles.icon_emoji 에 저장한다:
/// "mascot:<이름>" 이면 우리집 레시피 캐릭터, 그 밖의 글자는 이모지, 비어 있으면 이름으로 정한 기본 캐릭터.
enum ProfileIcon {
    static let prefix = "mascot:"

    /// 고를 수 있는 캐릭터 (웹 EmojiPicker 와 같은 목록)
    static let mascots: [String] = [
        "main",
        "basic",
        "excited",
        "happy",
        "laugh",
        "tasty",
        "love",
        "shy",
        "surprised",
        "sparkle",
        "confused",
        "idea",
        "rest",
        "sleep",
        "cooking",
        "recipe",
        "fridge",
        "shopping",
        "giggle",
        "heart-eyes",
        "big-hug",
        "puzzled",
        "singing",
        "loved",
        "trophy",
        "confetti-happy",
        "whisking",
        "chopping",
        "stirring-pot",
        "frying-egg",
        "apron-spatula",
        "reading-recipe",
        "baking-cookies",
        "washing-veggies",
        "shopping-basket",
        "grocery-bag",
        "curry-plate",
        "pancake-hold",
        "pizza-hold",
        "burger-hold",
        "bubbletea-hold",
        "salad-hold",
        "item-pot",
        "item-spoon",
        "item-tomato",
        "item-carrot",
        "item-greens",
        "item-meat",
        "item-mushroom",
        "item-egg",
        "item-cheese",
        "item-bag",
        "food-onion",
        "food-garlic",
        "food-potato",
        "food-bellpepper",
        "food-noodles",
        "food-bread",
        "food-milk",
        "food-salmon",
        "food-shrimp",
        "food-chicken",
        "food-cheese2",
        "food-strawberry",
        "food-lemon",
        "food-blueberry",
        "food-toast",
        "tool-whisk",
        "tool-spatula",
        "tool-chefhat",
        "tool-apron",
        "tool-pan",
        "tool-knife",
        "tongue-out",
        "thumbs-up",
        "peeking",
        "content",
        "cheerful",
        "floating",
        "cheering",
        "chef-greeting",
        "tool-ricescoop",
        "tool-pot",
        "tool-fridge",
        "food-cucumber",
        "food-broccoli",
        "food-bellpepper-yellow",
        "food-chilipepper",
        "food-corn",
        "food-ricebowl",
        "food-peabowl",
        "food-spaghetti",
        "food-omurice",
        "food-curryrice",
        "food-lemonhalf",
        "food-pancake",
        "food-cupcake",
        "badge-sparkle",
        "badge-corn",
        "badge-musicnote",
        "badge-bubble"
    ]

    static func token(_ mascot: String) -> String { prefix + mascot }

    static func mascot(in icon: String?) -> String? {
        guard let icon, icon.hasPrefix(prefix) else { return nil }
        let name = String(icon.dropFirst(prefix.count))
        return mascots.contains(name) ? name : nil
    }

    /// 아이콘을 정하지 않은 사람에게 이름마다 항상 같은 기본 캐릭터를 보여 준다
    static let defaults = ["basic", "happy", "excited", "tasty", "love", "cooking", "idea", "cheerful", "content", "thumbs-up"]
    static func fallback(for name: String) -> String { defaults[Recipe.stableIndex(name, defaults.count)] }
}

/// 동그란 프로필 사진 자리 (캐릭터 / 이모지 / 기본 캐릭터)
struct ProfileIconView: View {
    let icon: String?
    let name: String
    var size: CGFloat = 40

    var body: some View {
        Circle().fill(Theme.surface).frame(width: size, height: size)
            .overlay {
                if let m = ProfileIcon.mascot(in: icon) {
                    Image("pf-\(m)").resizable().scaledToFit().padding(size * 0.12)
                } else if let icon, !icon.isEmpty {
                    Text(icon).font(.system(size: size * 0.55))
                } else {
                    Image("pf-\(ProfileIcon.fallback(for: name))").resizable().scaledToFit().padding(size * 0.12)
                }
            }
            .clipShape(Circle())
    }
}

/// 아이콘 고르기 (캐릭터 격자)
struct ProfileIconPicker: View {
    @Binding var icon: String?

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 5), spacing: 10) {
            ForEach(ProfileIcon.mascots, id: \.self) { m in
                let token = ProfileIcon.token(m)
                Button { icon = icon == token ? nil : token } label: {
                    Image("pf-\(m)").resizable().scaledToFit().padding(8)
                        .frame(maxWidth: .infinity).aspectRatio(1, contentMode: .fit)
                        .background(icon == token ? Theme.accentSoft : Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(icon == token ? Theme.accent : .clear, lineWidth: 2))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

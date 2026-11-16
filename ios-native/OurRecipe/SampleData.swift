import SwiftUI

enum Sample {
    private static let base: [Recipe] = [
        Recipe(id: "kimchi-rice", emoji: "🍚", photo: "food-ricebowl", title: "김치볶음밥", sub: "팬 하나로 끝나는 한 그릇",
               tags: ["한식"], time: "15분", serving: "1인분", tintHex: 0xFDE7D9,
               ings: [.init(name: "밥", amt: "1공기"), .init(name: "김치", amt: "1컵"), .init(name: "계란", amt: "1개"),
                      .init(name: "대파", amt: "1/2대"), .init(name: "참기름", amt: "1큰술")],
               steps: [.init(text: "대파를 송송 썰어 기름 두른 팬에 약불로 향을 내요."),
                       .init(text: "잘게 썬 김치를 넣고 중불에서 볶아요.", timer: 180),
                       .init(text: "밥을 넣고 고루 섞은 뒤 참기름을 둘러요."),
                       .init(text: "반숙 계란 프라이를 올려 마무리해요.")]),
        Recipe(id: "doenjang", emoji: "🍲", photo: "food-soup", title: "된장찌개", sub: "두부 듬뿍, 구수한 기본 찌개",
               tags: ["한식"], time: "25분", serving: "2인분", tintHex: 0xF3E3C6,
               ings: [.init(name: "두부", amt: "1/2모"), .init(name: "애호박", amt: "1/2개"), .init(name: "양파", amt: "1/2개"),
                      .init(name: "대파", amt: "1/2대"), .init(name: "된장", amt: "2큰술"), .init(name: "멸치육수", amt: "2컵")],
               steps: [.init(text: "육수에 된장을 풀고 양파, 애호박을 먼저 넣어요."),
                       .init(text: "한소끔 끓어오르면 중불로 줄여 끓여요.", timer: 600),
                       .init(text: "두부와 대파를 넣고 2분만 더 끓여요.", timer: 120)]),
        Recipe(id: "egg-roll", emoji: "🥚", photo: "food-egg2", title: "계란말이", sub: "도시락 반찬 단골",
               tags: ["한식"], time: "10분", serving: "2인분", tintHex: 0xFBF0B8,
               ings: [.init(name: "계란", amt: "4개"), .init(name: "대파", amt: "1/4대"),
                      .init(name: "당근", amt: "1/4개"), .init(name: "소금", amt: "약간")],
               steps: [.init(text: "계란을 풀고 다진 대파, 당근, 소금을 섞어요."),
                       .init(text: "약불 팬에 얇게 부어 돌돌 말아요."),
                       .init(text: "한 김 식힌 뒤 먹기 좋게 썰어요.", timer: 60)]),
        Recipe(id: "tomato-pasta", emoji: "🍝", photo: "food-spaghetti", title: "토마토 파스타", sub: "신선한 토마토로 가볍게",
               tags: ["양식"], time: "20분", serving: "1인분", tintHex: 0xFAD9D5,
               ings: [.init(name: "스파게티면", amt: "100g"), .init(name: "토마토", amt: "2개"), .init(name: "양파", amt: "1/4개"),
                      .init(name: "마늘", amt: "3쪽"), .init(name: "올리브유", amt: "2큰술")],
               steps: [.init(text: "끓는 소금물에 면을 넣고 삶아요.", timer: 480),
                       .init(text: "올리브유에 마늘, 양파를 볶다가 토마토를 으깨 넣어요."),
                       .init(text: "삶은 면을 소스에 넣고 1분 더 볶아요.", timer: 60)]),
        Recipe(id: "chicken-salad", emoji: "🥗", photo: "salad-hold", title: "닭가슴살 샐러드", sub: "가볍게 먹는 한 끼",
               tags: ["간편"], time: "10분", serving: "1인분", tintHex: 0xDDEFD2,
               ings: [.init(name: "닭가슴살", amt: "1팩"), .init(name: "양상추", amt: "한 줌"),
                      .init(name: "토마토", amt: "1개"), .init(name: "올리브유", amt: "1큰술")],
               steps: [.init(text: "닭가슴살을 결대로 찢어요."),
                       .init(text: "양상추와 토마토를 먹기 좋게 썰어 담아요."),
                       .init(text: "올리브유와 소금, 후추로 간해요.")]),
    ]

    static let recipes: [Recipe] = {
        var r = base
        r[0].link = "https://www.instagram.com/reel/kimchi-rice"
        r[0].linkTitle = "자취생 필수 레시피 | 팬 하나로 끝나는 김치볶음밥 • Instagram reel"
        r[1].link = "https://www.youtube.com/watch?v=doenjang"
        r[1].linkTitle = "구수한 된장찌개 황금레시피 - YouTube"
        r[1].fav = true
        r[3].link = "https://www.instagram.com/reel/tomato-pasta"
        r[3].linkTitle = "마놉 레시피 | 맛보장 초간단 토마토 파스타 • Instagram reel"
        r.append(Recipe(
            id: "link-only", emoji: "🍝", photo: "plated-dish", title: "", sub: "", tags: ["간편"], time: "", serving: "",
            tintHex: 0xE6DDF5, ings: [], steps: [],
            link: "https://www.instagram.com/reel/papa-spoon",
            linkTitle: "파파스푼 | 먹성좋은 신혼부부의 간편한 집밥 요리 (@papa__spoon) • Instagram reel"))
        return r
    }()

    /// 링크/직접 입력으로 "만들어지는" 시연용 레시피
    static let generated = Recipe(
        id: "generated", emoji: "🍢", photo: "plated-dish", title: "간장 어묵볶음", sub: "링크에서 가져온 레시피",
        tags: ["간편"], time: "12분", serving: "2인분", tintHex: 0xE6DDF5,
        ings: [.init(name: "어묵", amt: "3장"), .init(name: "양파", amt: "1/2개"),
               .init(name: "대파", amt: "1/2대"), .init(name: "간장", amt: "2큰술")],
        steps: [.init(text: "어묵은 끓는 물에 데쳐 기름기를 빼요."),
                .init(text: "양파, 대파와 함께 중불에서 볶아요.", timer: 240),
                .init(text: "간장을 둘러 윤기 나게 졸여요.")],
        saved: false)

    static let fridge: [FridgeItem] = [
        .init(name: "두부", amt: "1모", days: 1), .init(name: "대파", amt: "1단", days: 2),
        .init(name: "밥", amt: "2공기", days: 3), .init(name: "토마토", amt: "3개", days: 4),
        .init(name: "계란", amt: "6개", days: 5), .init(name: "양파", amt: "2개", days: 10),
        .init(name: "김치", amt: "1/2포기", days: 20),
    ]

    static let shop: [ShopItem] = [
        .init(name: "우유", amt: "1팩", from: ShopItem.manual),
        .init(name: "식빵", amt: "1봉", from: ShopItem.manual),
    ]

    static let members: [Member] = [
        .init(name: "영공", role: "대장 (나)", tintHex: 0xFDECE7, isMe: true),
        .init(name: "민준", role: "참여자", tintHex: 0xFDE7D9),
        .init(name: "엄마", role: "참여자", tintHex: 0xE6DDF5),
    ]

    static let inviteCode = "YG-4821"
    static let inviteLink = "https://example.com/join/YG-4821"
}

extension ShopItem {
    static let manual = "직접 담은 것"
}

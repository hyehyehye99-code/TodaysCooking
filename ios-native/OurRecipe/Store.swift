import SwiftUI
import UIKit

/// 목업 전용 인메모리 스토어. 네트워크·DB 없음.
@Observable
@MainActor
final class Store {
    var tab: AppTab = .chat
    var recipes: [Recipe] = Sample.recipes
    var fridge: [FridgeItem] = Sample.fridge
    var shop: [ShopItem] = Sample.shop
    /// 내가 속한 주방들과 지금 쓰는 주방
    var kitchens: [Kitchen] = [
        Kitchen(name: "영공이네", members: Sample.members),
        Kitchen(name: "캠핑 레시피", members: [Member(name: "영공", role: "대장 (나)", tint: Theme.accentSoft, isMe: true)]),
    ]
    var currentKitchen = 0
    var members: [Member] {
        get { kitchens[currentKitchen].members }
        set { kitchens[currentKitchen].members = newValue }
    }
    /// 레시피 탭의 화면 스택 (상세·등록 폼이 모달이 아닌 전체 페이지로 쌓인다)
    var recipePath: [RecipeRoute] = []
    var toast: String?
    var kitchenName: String {
        get { kitchens[currentKitchen].name }
        set { kitchens[currentKitchen].name = newValue }
    }
    /// 대화방에서 부르는 AI 셰프의 이름 (주방 설정에서 바꿀 수 있다)
    var chefName = "AI 셰프"
    var showKitchenSettings = false
    var showFridge = false
    var timers: [SavedTimer] = []
    var mealboards: [Mealboard] = []
    var myPath: [MyRoute] = []
    /// AI 자동 정리: 이번 주 사용 횟수 / 무료 한도 / 프로모션 보너스
    var aiUsed = 6
    let aiLimit = 20
    var aiBonus = 31

    var msgs: [Msg] = []
    /// 대화를 초기화하면 올라가서, 진행 중이던 셰프의 답장이 뒤늦게 끼어들지 않게 한다
    private var chatGen = 0
    var typing = false

    private var toastTask: Task<Void, Never>?
    private var chimed = false

    init() {
        // 디버그용: `-tab recipes|shop|my` 로 시작 탭 지정
        switch UserDefaults.standard.string(forKey: "tab") {
        case "recipes": tab = .recipes
        case "shop": tab = .shop
        case "my": tab = .my
        default: break
        }
        if let id = UserDefaults.standard.string(forKey: "detail") { tab = .recipes; recipePath = [.detail(id)] }
        showKitchenSettings = UserDefaults.standard.bool(forKey: "kitchen")
        showFridge = UserDefaults.standard.bool(forKey: "fridge")
        if UserDefaults.standard.bool(forKey: "form") { tab = .recipes; recipePath = [.form("")] }
        if let id = UserDefaults.standard.string(forKey: "propose") { Task { try? await Task.sleep(for: .milliseconds(300)); proposeRecipe(id, note: "") } }
        if UserDefaults.standard.bool(forKey: "demofridge") { Task { try? await Task.sleep(for: .milliseconds(300)); askFridge() } }
        if UserDefaults.standard.bool(forKey: "mealform") { tab = .my; myPath = [.mealboard, .mealboardForm(nil)] }
        if let v = UserDefaults.standard.string(forKey: "mealdemo") {
            let b = Mealboard(title: "홈파티 메뉴", icon: .emoji("🎉"), date: FridgeItem.date(afterDays: 9), headcount: 6,
                              recipeIds: ["tomato-pasta", "chicken-salad", "egg-roll"])
            mealboards.append(b); tab = .my; myPath = v == "list" ? [.mealboard] : v == "recipe" ? [.mealboard, .mealboardDetail(b.id), .recipe("tomato-pasta")] : [.mealboard, .mealboardDetail(b.id)]
        }
        if UserDefaults.standard.bool(forKey: "shopdemo") {
            Task { try? await Task.sleep(for: .milliseconds(300)); if let r = recipe("doenjang") { addMissing(r) }; if let f = shop.first { toggle(f) } }
        }
        if UserDefaults.standard.bool(forKey: "demolink") { Task { try? await Task.sleep(for: .milliseconds(300)); submit("https://youtu.be/demo") } }
    }

    // MARK: 파생

    var savedRecipes: [Recipe] { recipes.filter(\.saved) }
    var openShopCount: Int { shop.filter { !$0.checked }.count }

    func recipe(_ id: String) -> Recipe? { recipes.first { $0.id == id } }
    func inFridge(_ name: String) -> Bool { fridge.contains { $0.name == name } }
    func missing(_ r: Recipe) -> [Ingredient] { r.ings.filter { !inFridge($0.name) && !r.skipped.contains($0.name) } }

    /// 어디서든 레시피 상세를 전체 페이지로 연다 (대화 카드의 "자세히" 등)
    func openRecipe(_ id: String) {
        tab = .recipes
        recipePath = [.detail(id)]
    }

    // MARK: 토스트

    func showToast(_ text: String) {
        toast = text
        toastTask?.cancel()
        toastTask = Task {
            try? await Task.sleep(for: .milliseconds(1800))
            if !Task.isCancelled { toast = nil }
        }
    }

    func copy(_ text: String, done: String) {
        UIPasteboard.general.string = text
        showToast(done)
    }

    // MARK: 레시피 · 장보기 · 냉장고

    func addMissing(_ r: Recipe) {
        let all = missing(r)
        let lack = all.filter { i in !shop.contains { $0.name == i.name } }
        guard !lack.isEmpty else {
            showToast(all.isEmpty ? "빠진 재료가 없어요" : "장보기에 담겨 있어요")
            return
        }
        shop += lack.map { ShopItem(name: $0.name, amt: $0.amt, from: r.title) }
        showToast("장보기에 \(lack.count)개 담았어요")
    }

    func save(_ id: String) {
        guard let i = recipes.firstIndex(where: { $0.id == id }) else { return }
        recipes[i].saved = true
        showToast("저장했어요")
    }

    func toggleFav(_ id: String) {
        guard let i = recipes.firstIndex(where: { $0.id == id }) else { return }
        recipes[i].fav.toggle()
    }

    func deleteRecipe(_ id: String) {
        recipes.removeAll { $0.id == id }
        recipePath = []
        showToast("삭제했어요")
    }

    /// 재료 칩을 탭할 때마다 상태가 바뀐다: 선택 안 함 → 구매 필요(장보기) → 보유 중(냉장고) → 생략 → 선택 안 함
    /// (원래 냉장고에 있던 재료는 보유 중 → 생략 → 구매 필요 → 보유 중)
    func cycleIngredient(_ ing: Ingredient, in recipeId: String) {
        guard let ri = recipes.firstIndex(where: { $0.id == recipeId }) else { return }
        let name = ing.name
        let skipped = recipes[ri].skipped.contains(name)
        let inShop = shop.contains { $0.name == name }
        let have = inFridge(name)
        let baseline = have && !recipes[ri].chipFridge.contains(name)

        func addToShop() {
            shop.append(ShopItem(name: name, amt: ing.amt, from: recipes[ri].displayTitle))
            showToast("장보기에 담았어요")
        }

        if skipped {                      // 생략 → (원래 냉장고에 있던 재료면 구매 필요, 아니면 선택 안 함)
            recipes[ri].skipped.remove(name)
            if baseline {
                addToShop()
            } else if recipes[ri].chipFridge.contains(name) {
                fridge.removeAll { $0.name == name }
                recipes[ri].chipFridge.remove(name)
            }
        } else if inShop {                // 구매 필요 → 보유 중
            shop.removeAll { $0.name == name }
            if !have {
                fridge.append(FridgeItem(name: name, amt: ing.amt.isEmpty ? "1개" : ing.amt, days: nil))
                recipes[ri].chipFridge.insert(name)
                showToast("냉장고에 재료를 추가했어요")
            }
        } else if have {                  // 보유 중 → 생략
            recipes[ri].skipped.insert(name)
        } else {                          // 선택 안 함 → 구매 필요
            addToShop()
        }
    }

    // MARK: 요리 제안하기 — 메인 대화방에 올라가고 가족도 함께 본다

    func proposeRecipe(_ id: String, note: String) {
        guard let r = recipe(id) else { return }
        let text = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let msg = Msg(fromMe: true, text: text.isEmpty ? "오늘은 \(r.displayTitle) 어때?" : text, card: .recipe(id))
        tab = .chat
        recipePath = []
        myPath = []
        push(msg)
        let gen = chatGen
        Task {
            try? await Task.sleep(for: .milliseconds(900))
            guard gen == chatGen else { return }
            if let i = msgs.firstIndex(where: { $0.id == msg.id }) { msgs[i].seen = "민준, 엄마가 봤어요" }
            try? await Task.sleep(for: .milliseconds(900))
            guard gen == chatGen else { return }
            push(Msg(fromMe: false, text: "오 나 이거 좋아!", mate: "민준"))
            try? await Task.sleep(for: .milliseconds(1000))
            guard gen == chatGen else { return }
            push(Msg(fromMe: false, text: "그럼 장 봐올게~ 🛒", mate: "엄마"))
        }
    }

    // MARK: 새 메뉴 등록 / 수정

    /// "파마산 치즈 80g" → (파마산 치즈, 80g). 마지막 토막에 숫자가 있으면 계량으로 본다
    static func parseIngredients(_ text: String) -> [Ingredient] {
        text.split(whereSeparator: \.isNewline).compactMap { line in
            let t = line.trimmingCharacters(in: .whitespaces)
            guard !t.isEmpty else { return nil }
            let parts = t.split(separator: " ").map(String.init)
            if parts.count > 1, let last = parts.last, last.contains(where: \.isNumber) {
                return Ingredient(name: parts.dropLast().joined(separator: " "), amt: last)
            }
            return Ingredient(name: t, amt: "")
        }
    }

    /// "1. 오일을 두르고…" 같은 번호는 떼고, "3분" 같은 시간이 있으면 타이머를 붙인다
    static func parseSteps(_ text: String) -> [Step] {
        text.split(whereSeparator: \.isNewline).compactMap { line in
            var t = line.trimmingCharacters(in: .whitespaces)
            if let r = t.range(of: #"^\d+[.)]\s*"#, options: .regularExpression) { t.removeSubrange(r) }
            guard !t.isEmpty else { return nil }
            let min = t.range(of: #"\d+(?=\s*분)"#, options: .regularExpression).flatMap { Int(t[$0]) }
            return Step(text: t, timer: min.map { $0 * 60 })
        }
    }

    /// 저장에 성공하면 true
    @discardableResult
    func saveRecipe(editing id: String?, title: String, link: String, ings: String, steps: String, hide: Bool, linkTitle: String?) -> Bool {
        let t = title.trimmingCharacters(in: .whitespaces)
        let l = link.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty || !l.isEmpty else { return false }
        let parsedIngs = Store.parseIngredients(ings)
        let parsedSteps = Store.parseSteps(steps)
        if let id, let i = recipes.firstIndex(where: { $0.id == id }) {
            recipes[i].title = t
            recipes[i].link = l.isEmpty ? nil : l
            recipes[i].linkTitle = l.isEmpty ? nil : (linkTitle ?? recipes[i].linkTitle)
            recipes[i].ings = parsedIngs
            recipes[i].steps = parsedSteps
            recipes[i].hideIngredients = hide
        } else {
            let tints: [UInt32] = [0xFDE7D9, 0xF3E3C6, 0xFBF0B8, 0xFAD9D5, 0xDDEFD2, 0xE6DDF5]
            let host = URL(string: l)?.host?.replacingOccurrences(of: "www.", with: "") ?? l
            recipes.append(Recipe(
                id: UUID().uuidString, emoji: "🍽️", photo: ["plated-dish", "food-soup", "food-ricebowl", "food-spaghetti"].randomElement()!,
                title: t, sub: "", cat: .easy, time: "", serving: "",
                tint: Color(hex: tints.randomElement()!), ings: parsedIngs, steps: parsedSteps,
                link: l.isEmpty ? nil : l,
                linkTitle: l.isEmpty ? nil : (linkTitle ?? "저장한 링크 · \(host)"),
                author: members.first(where: \.isMe)?.name ?? "영공", hideIngredients: hide))
        }
        showToast("저장했어요")
        return true
    }

    func toggle(_ item: ShopItem) {
        guard let i = shop.firstIndex(where: { $0.id == item.id }) else { return }
        shop[i].checked.toggle()
    }

    /// "우유 2팩" → 이름 우유, 수량 2팩
    func addShop(_ text: String) {
        guard let ing = Store.parseIngredients(text).first else { return }
        guard !shop.contains(where: { $0.name == ing.name }) else { showToast("이미 장보기에 있어요"); return }
        shop.append(ShopItem(name: ing.name, amt: ing.amt.isEmpty ? "1개" : ing.amt, from: ShopItem.manual))
    }

    func removeShop(_ ids: Set<UUID>) { shop.removeAll { ids.contains($0.id) } }

    func clearCheckedShop() {
        let n = shop.filter(\.checked).count
        shop.removeAll { $0.checked }
        if n > 0 { showToast("체크한 \(n)개를 지웠어요") }
    }

    func clearAllShop() {
        shop.removeAll()
        showToast("장보기 목록을 비웠어요")
    }

    func completeShopping() {
        let bought = shop.filter(\.checked)
        guard !bought.isEmpty else { return }
        for b in bought where !inFridge(b.name) {
            fridge.append(FridgeItem(name: b.name, amt: b.amt, days: nil))
        }
        shop.removeAll { $0.checked }
        showToast("냉장고에 재료 \(bought.count)개를 추가했어요")
    }

    var soonCount: Int { fridge.filter(\.isSoon).count }

    /// 냉장고에 재료 넣기 (유통기한은 선택)
    @discardableResult
    func addFridge(name: String, amt: String, expiry: Date?) -> Bool {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { return false }
        guard !inFridge(n) else { showToast("이미 냉장고에 있어요"); return false }
        let a = amt.trimmingCharacters(in: .whitespaces)
        fridge.append(FridgeItem(name: n, amt: a.isEmpty ? "1개" : a, expiry: expiry))
        showToast("냉장고에 재료를 추가했어요")
        return true
    }

    func updateFridge(_ id: UUID, name: String, amt: String, expiry: Date?) {
        guard let i = fridge.firstIndex(where: { $0.id == id }) else { return }
        let n = name.trimmingCharacters(in: .whitespaces)
        if !n.isEmpty { fridge[i].name = n }
        fridge[i].amt = amt.trimmingCharacters(in: .whitespaces)
        fridge[i].expiry = expiry
        showToast("저장했어요")
    }

    func removeFridge(_ ids: Set<UUID>) {
        fridge.removeAll { ids.contains($0.id) }
    }

    // MARK: 냉장고 정리 알림

    var cleanupReminder = false
    var cleanupFreq: CleanupFrequency = .weekly

    func setCleanupReminder(_ on: Bool) {
        if !on {
            Reminders.disable()
            cleanupReminder = false
            showToast("냉장고 정리 알림을 껐어요")
            return
        }
        Task {
            if await Reminders.enable(cleanupFreq) {
                cleanupReminder = true
                showToast("냉장고 정리 알림을 켰어요")
            } else {
                cleanupReminder = false
                showToast("설정에서 알림 권한을 허용해주세요.")
            }
        }
    }

    func setCleanupFreq(_ f: CleanupFrequency) {
        cleanupFreq = f
        if cleanupReminder { Task { _ = await Reminders.enable(f) } }
    }

    // MARK: 메뉴판

    @discardableResult
    func saveMealboard(editing id: UUID?, title: String, icon: BoardIcon, date: Date?, headcount: Int?, recipeIds: [String]) -> Bool {
        let t = title.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return false }
        if let id, let i = mealboards.firstIndex(where: { $0.id == id }) {
            mealboards[i].title = t; mealboards[i].icon = icon; mealboards[i].date = date
            mealboards[i].headcount = headcount; mealboards[i].recipeIds = recipeIds
            showToast("저장했어요")
        } else {
            mealboards.append(Mealboard(title: t, icon: icon, date: date, headcount: headcount, recipeIds: recipeIds))
            showToast("메뉴판을 만들었어요")
        }
        return true
    }

    func deleteMealboard(_ id: UUID) {
        mealboards.removeAll { $0.id == id }
        showToast("삭제했어요")
    }

    func renameMe(_ name: String) {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty, let i = members.firstIndex(where: \.isMe) else { return }
        members[i].name = n
        showToast("프로필을 저장했어요.")
    }

    // MARK: 주방 설정 — 저장 버튼을 눌렀을 때만 바뀐다

    func renameKitchen(_ name: String) {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { return }
        kitchenName = n
        showToast("이름을 저장했어요.")
    }

    func renameChef(_ name: String) {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { return }
        chefName = n
        showToast("셰프 이름을 저장했어요.")
    }

    func switchKitchen(to index: Int) {
        guard kitchens.indices.contains(index), index != currentKitchen else { return }
        currentKitchen = index
        showToast("\(kitchenName)(으)로 바꿨어요")
    }

    func createKitchen(named name: String) {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { return }
        kitchens.append(Kitchen(name: n, members: [Member(name: members.first(where: \.isMe)?.name ?? "영공", role: "대장 (나)", tint: Theme.accentSoft, isMe: true)]))
        currentKitchen = kitchens.count - 1
        showToast("\(n)을(를) 만들었어요")
    }

    /// 초대 코드로 참여 (목업: 어떤 코드든 "친구네" 주방에 참여한 것으로 본다)
    func joinKitchen(code: String) {
        guard !code.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        kitchens.append(Kitchen(name: "친구네", members: [
            Member(name: "영공", role: "참여자", tint: Theme.accentSoft, isMe: true),
            Member(name: "하늘", role: "대장", tint: Color(hex: 0xDDEFD2)),
        ]))
        currentKitchen = kitchens.count - 1
        showToast("친구네에 참여했어요")
    }

    /// 마지막 남은 주방은 나갈 수 없다
    @discardableResult
    func leaveKitchen() -> Bool {
        guard kitchens.count > 1 else {
            showToast("마지막 주방이라 나갈 수 없어요. 먼저 새 주방을 만들어보세요")
            return false
        }
        let left = kitchenName
        kitchens.remove(at: currentKitchen)
        currentKitchen = 0
        showToast("\(left)에서 나왔어요")
        return true
    }

    func removeMember(_ m: Member) {
        members.removeAll { $0.id == m.id }
        showToast("\(m.name)셰프를 내보냈어요")
    }

    // MARK: 대화

    func push(_ m: Msg) { msgs.append(m) }

    /// 비서가 짧은 말풍선을 툭툭 이어서 말하는 연출
    func say(_ parts: [Msg]) {
        typing = true
        let gen = chatGen
        Task {
            for (i, p) in parts.enumerated() {
                let ms = 450 + min((p.text?.count ?? 0) * 14, 600)
                try? await Task.sleep(for: .milliseconds(ms))
                guard gen == chatGen else { return }
                push(p)
                if i == parts.count - 1 { typing = false }
            }
            // 같은 주방 메이트도 대화를 보고 한마디 거드는 연출 (한 번만)
            if !chimed, parts.contains(where: { if case .recipe = $0.card { return true } else { return false } }) {
                chimed = true
                try? await Task.sleep(for: .milliseconds(1400))
                guard gen == chatGen else { return }
                push(Msg(fromMe: false, text: "오 맛있겠다 ㅎㅎ", mate: "엄마"))
            }
        }
    }

    /// 대화 초기화 (저장한 레시피·냉장고·장보기는 그대로)
    func resetChat() {
        chatGen += 1
        typing = false
        msgs = []
    }

    func startTimer(sec: Int, label: String) {
        tab = .chat
        recipePath = []
        myPath = []
        push(Msg(fromMe: false, text: "\(label) 타이머 시작할게요.", card: .timer(label: label, sec: sec)))
    }

    func recommend() {
        say([
            Msg(fromMe: false, text: "🧊 냉장고를 열어 봤어요!", mood: "fridge-open"),
            Msg(fromMe: false, text: "두부랑 대파가 곧 끝나요. 이걸로 골랐어요.", card: .fridge, mood: "idea"),
        ])
    }

    /// 빠른 시작 카드 "냉장고 파먹기"
    func askFridge() {
        push(Msg(fromMe: true, text: "냉장고에 있는 재료로, 소비기한 임박한 것부터 써서 만들 수 있는 요리 추천해줘"))
        recommend()
    }

    /// 링크를 보내면 바로 레시피로 저장해 주는 흐름 (목업이라 항상 같은 레시피가 만들어진다)
    func saveLink(_ link: String) {
        if let i = recipes.firstIndex(where: { $0.id == Sample.generated.id }), recipes[i].saved {
            say([Msg(fromMe: false, text: "이미 레시피북에 있어요!", card: .recipe(Sample.generated.id))])
            return
        }
        var r = Sample.generated
        r.saved = true
        if let i = recipes.firstIndex(where: { $0.id == r.id }) { recipes[i] = r } else { recipes.append(r) }
        say([
            Msg(fromMe: false, text: "📹 영상 정보와 조리 과정을 읽고 있어요...", mood: "reading-recipe"),
            Msg(fromMe: false, text: "🥕 재료와 정확한 계량을 정리하는 중이에요...", mood: "chopping"),
            Msg(fromMe: false, text: "🍳 \(kitchenName) 레시피북에 예쁘게 저장 중이에요...", mood: "stirring-pot"),
            Msg(fromMe: false, text: "저장했어요!", card: .recipe(r.id), mood: "excited"),
        ])
    }

    func submit(_ raw: String) {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return }
        push(Msg(fromMe: true, text: t))
        if t.contains("http") {
            saveLink(t)
        } else if t.contains("냉장고") || t.contains("추천") || t.contains("재료") || t.contains("해 먹") || t.contains("해먹") {
            recommend()
        } else {
            say([Msg(fromMe: false, text: "🧑‍🍳 그건 아직 배우는 중이에요! 링크를 보내주시거나 냉장고 파먹기를 시켜주세요.", mood: "puzzled")])
        }
    }

    /// 클립보드의 링크 (없으면 nil, 알림은 요청했을 때만)
    func pasteLink(notify: Bool = true) -> String? {
        guard let s = UIPasteboard.general.string, s.contains("http") else {
            if notify { showToast("복사한 링크가 없어요") }
            return nil
        }
        return s
    }
}

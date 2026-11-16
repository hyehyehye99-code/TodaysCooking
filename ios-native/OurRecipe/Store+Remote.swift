import SwiftUI

// MARK: - 동기화 상태 · 로컬 저장 형식

/// 서버에 마지막으로 반영된 모양. 화면의 현재 값과 비교(diff)해서 달라진 것만 서버로 보낸다.
struct SyncState {
    var householdId: String?
    var recipes: [String: Recipe] = [:]
    var fridge: [String: FridgeItem] = [:]      // 이름이 키 (서버 unique: household_id + name)
    var shop: [UUID: ShopItem] = [:]
    /// 새 레시피는 목록 맨 위에 오도록 지금까지 가장 작은 position 보다 작게 만든다
    var topPosition = 0
    var pushing = false
    var dirty = false
    /// 게스트 데이터를 옮기는 첫 로그인 때는 가족에게 알림이 쏟아지지 않게 한다
    var suppressNotify = false
}

/// 기기에 저장하는 내용. 게스트는 레시피·냉장고·장보기까지, 로그인하면 서버에 없는 것(메뉴판·타이머·셰프 이름)만 저장한다.
struct LocalSnapshot: Codable {
    var recipes: [Recipe]?
    var fridge: [FridgeItem]?
    var shop: [ShopItem]?
    var kitchenName: String?
    var mealboards: [Mealboard] = []
    var timers: [SavedTimer] = []
    var chefName: String = "AI 셰프"
}

enum LocalPersistence {
    static var url: URL = {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("OurRecipe", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("local.json")
    }()

    static func load() -> LocalSnapshot? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(LocalSnapshot.self, from: data)
    }

    static func save(_ snapshot: LocalSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        try? data.write(to: url, options: [.atomic, .completeFileProtection])
    }

    static func clear() { try? FileManager.default.removeItem(at: url) }
}

// MARK: - 로컬 저장 · 변경 감시

extension Store {
    static let activeHouseholdKey = "activeHouseholdId"

    func restoreLocal() {
        guard let snap = LocalPersistence.load() else { return }
        mealboards = snap.mealboards
        timers = snap.timers
        chefName = snap.chefName
        // 로그인 상태로 시작하면 서버 값이 우선이라, 게스트 데이터는 게스트일 때만 복원한다
        if hasSavedSession { return }
        recipes = snap.recipes ?? []
        fridge = snap.fridge ?? []
        shop = snap.shop ?? []
        if let name = snap.kitchenName { kitchens[0].name = name }
    }

    /// 앱이 시작할 때 키체인에 세션이 있으면 곧 서버 모드로 들어간다
    private var hasSavedSession: Bool {
        guard Config.isBackendConfigured, let data = Keychain.get("supabase.session") else { return false }
        return (try? JSONDecoder().decode(AuthSession.self, from: data)) != nil
    }

    func persistLocal() {
        var snap = LocalSnapshot(mealboards: mealboards, timers: timers, chefName: chefName)
        if !isRemote && !demoMode {
            snap.recipes = recipes; snap.fridge = fridge; snap.shop = shop; snap.kitchenName = kitchens.first?.name
        }
        LocalPersistence.save(snap)
    }

    /// 값이 바뀔 때마다(잠깐 모아서) 기기에 저장하고, 로그인 상태면 서버에도 반영한다
    func observeChanges() {
        withObservationTracking {
            _ = recipes; _ = fridge; _ = shop; _ = mealboards; _ = timers; _ = chefName; _ = kitchens
        } onChange: { [weak self] in
            Task { @MainActor in
                self?.scheduleFlush()
                self?.observeChanges()
            }
        }
    }

    func scheduleFlush() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(500))
            guard !Task.isCancelled, let self else { return }
            if !self.demoMode { self.persistLocal() }
            await self.pushChanges()
        }
    }

    /// 화면 확인용 샘플 데이터 (DEBUG 의 -sample 인자)
    func loadSamples() {
        demoMode = true
        recipes = Sample.recipes
        fridge = Sample.fridge
        shop = Sample.shop
        kitchens = [Kitchen(name: "영공이네", members: Sample.members), Kitchen(name: "캠핑 레시피", members: [Sample.members[0]])]
    }
}

// MARK: - 서버로 변경 보내기 (diff)

extension Store {
    func reportSyncFailure(_ error: Error) {
        // 같은 오류가 연달아 떠서 토스트가 쏟아지지 않게 몇 초에 한 번만 알린다
        guard Date().timeIntervalSince(lastSyncToastAt) > 8 else { return }
        lastSyncToastAt = Date()
        if case BackendError.notSignedIn = error { return }
        showToast("서버에 저장하지 못했어요. 연결을 확인해주세요")
    }

    func pushChanges() async {
        guard isRemote, let hid = sync.householdId, let uid = userId else { return }
        if sync.pushing { sync.dirty = true; return }
        sync.pushing = true
        defer { sync.pushing = false }
        repeat {
            sync.dirty = false
            do {
                try await pushRecipes(hid, uid)
                try await pushFridge(hid)
                try await pushShop(hid)
            } catch {
                reportSyncFailure(error)
                return   // 스냅샷은 성공한 만큼만 바뀌어 있어서 다음 변경 때 이어서 시도한다
            }
        } while sync.dirty
    }

    private func pushRecipes(_ hid: String, _ uid: String) async throws {
        let current = Dictionary(recipes.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        // 오래된 것부터 만들어야 위치(position)가 원래 순서를 유지한다
        for r in recipes.reversed() {
            guard let old = sync.recipes[r.id] else {
                sync.topPosition -= 1
                try await Repository.createRecipe(r, household: hid, user: uid, position: sync.topPosition)
                sync.recipes[r.id] = r
                continue
            }
            guard old.syncFields != r.syncFields else { continue }
            if old.syncFields.withoutFav == r.syncFields.withoutFav {
                try await Repository.setFavorite(r.id, r.fav)
            } else if old.syncFields.withoutFavAndSkipped == r.syncFields.withoutFavAndSkipped {
                for name in old.skipped.symmetricDifference(r.skipped) {
                    try await Repository.setIngredientSkipped(recipe: r.id, name: name, skipped: r.skipped.contains(name))
                }
                if old.fav != r.fav { try await Repository.setFavorite(r.id, r.fav) }
            } else {
                try await Repository.updateRecipe(r, household: hid, user: uid)
            }
            sync.recipes[r.id] = r
        }
        for id in Array(sync.recipes.keys) where current[id] == nil {
            try await Repository.deleteRecipe(id)
            sync.recipes[id] = nil
        }
    }

    private func pushFridge(_ hid: String) async throws {
        let current = Dictionary(fridge.map { ($0.name, $0) }, uniquingKeysWith: { a, _ in a })
        for item in fridge {
            if let old = sync.fridge[item.name], old.expiry == item.expiry { continue }
            try await Repository.upsertFridge(item, household: hid)
            sync.fridge[item.name] = item
        }
        for name in Array(sync.fridge.keys) where current[name] == nil {
            try await Repository.removeFridge(name: name, household: hid)
            sync.fridge[name] = nil
        }
    }

    private func pushShop(_ hid: String) async throws {
        let ids = Set(shop.map(\.id))
        var added: [String] = []
        for item in shop {
            guard let old = sync.shop[item.id] else {
                try await Repository.insertShopping(item, household: hid)
                sync.shop[item.id] = item
                added.append(item.name)
                continue
            }
            if old.checked != item.checked {
                try await Repository.setShoppingChecked(item.id, item.checked)
                sync.shop[item.id] = item
            }
        }
        for id in Array(sync.shop.keys) where !ids.contains(id) {
            try await Repository.deleteShopping(id)
            sync.shop[id] = nil
        }
        // 새로 담은 항목이 있으면 가족에게 한 번만 알린다 (웹의 장보기 추가 알림과 같은 문구)
        if !added.isEmpty, !sync.suppressNotify { Task { await PushAPI.notify(.shoppingAdded(added), householdId: hid) } }
        sync.suppressNotify = false
    }
}

// MARK: - 로그인 · 서버에서 불러오기

extension Store {
    func bindAuth() async {
        await handleSession(await Backend.shared.session)
        armAuthObservation()
    }

    private func armAuthObservation() {
        withObservationTracking {
            _ = auth.session
        } onChange: { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                await self.handleSession(self.auth.session)
                self.armAuthObservation()
            }
        }
    }

    func handleSession(_ s: AuthSession?) async {
        if let s {
            if isRemote && userId == s.userId { return }
            await enterRemote(s)
        } else if isRemote || userId != nil {
            leaveRemote()
        }
    }

    private func enterRemote(_ s: AuthSession) async {
        loading = true
        defer { loading = false }
        // 로그인 직전의 게스트 데이터는 서버로 옮겨 준다 (웹의 guest-import 와 같은 흐름)
        let guest = isRemote || demoMode ? ([], [], []) : (recipes, fridge, shop)
        userId = s.userId
        userEmail = s.email
        do {
            let memberships = try await Repository.memberships(userId: s.userId)
            if memberships.compactMap(\.households).isEmpty {
                // 처음 가입: 이름과 우리집 이름을 직접 정하는 화면을 먼저 보여 준다
                setupGuest = guest
                showLogin = false
                try? await Task.sleep(for: .milliseconds(600))   // 로그인 시트가 내려간 뒤에 띄워야 화면이 겹치지 않는다
                needsSetup = true
                return
            }
            try await finishEnter(memberships, guest: guest)
        } catch {
            isRemote = false
            showToast("계정 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요")
        }
    }

    private func finishEnter(_ memberships: [RemoteMembership], guest: ([Recipe], [FridgeItem], [ShopItem])) async throws {
        applyMemberships(memberships, select: UserDefaults.standard.string(forKey: Store.activeHouseholdKey))
        isRemote = true
        showLogin = false
        await loadHousehold()
        importGuest(guest.0, guest.1, guest.2)
        if let code = pendingInviteCode { pendingInviteCode = nil; joinKitchen(code: code) }
        persistLocal()
        await PushManager.shared.onSignedIn()
    }

    /// 가입 설정 화면에서 "시작하기": 내 이름 저장 → (초대받았다면 그 우리집에 참여, 아니면) 새 우리집 만들기
    func completeSetup(myName: String, kitchenName: String) async {
        guard let uid = userId, !setupBusy else { return }
        setupBusy = true
        defer { setupBusy = false }
        do {
            try await Repository.upsertProfile(nickname: myName)
            var joined = false
            if let code = pendingInviteCode {
                pendingInviteCode = nil
                joined = (try? await Repository.joinHousehold(code: code)) != nil
            }
            if !joined { _ = try await Repository.createHousehold(name: kitchenName) }
            let memberships = try await Repository.memberships(userId: uid)
            needsSetup = false
            let guest = setupGuest
            setupGuest = ([], [], [])
            try await finishEnter(memberships, guest: guest)
        } catch {
            showToast("저장하지 못했어요. 잠시 후 다시 시도해주세요")
        }
    }

    /// 가입 설정을 하지 않고 나가기: 로그아웃해서 게스트 상태로 돌아간다 (게스트 레시피는 그대로 둔다)
    func cancelSetup() async {
        needsSetup = false
        setupGuest = ([], [], [])
        userId = nil          // handleSession(nil) 이 서버 모드 정리(= 화면 데이터 비우기)를 하지 않도록 먼저 비운다
        userEmail = nil
        await auth.signOut()
    }

    private func leaveRemote() {
        isRemote = false
        userId = nil
        userEmail = nil
        sync = SyncState()
        recipes = []; fridge = []; shop = []; mealboards = []
        kitchens = [Store.guestKitchen]
        currentKitchen = 0
        msgs = []
        UserDefaults.standard.removeObject(forKey: Store.activeHouseholdKey)
        persistLocal()
    }

    private func applyMemberships(_ ms: [RemoteMembership], select preferred: String?) {
        let list = ms.compactMap { m in
            m.households.map { Kitchen(householdId: $0.id.lowercased(), name: $0.name, members: [], inviteCode: $0.invite_code) }
        }
        guard !list.isEmpty else { return }
        kitchens = list
        currentKitchen = preferred.flatMap { id in list.firstIndex { $0.householdId == id.lowercased() } } ?? 0
        if let hid = list[currentKitchen].householdId { UserDefaults.standard.set(hid, forKey: Store.activeHouseholdKey); Keychain.set(Data(hid.utf8), for: SharedKeys.activeHousehold) }
    }

    /// 우리집 목록을 다시 읽고 select 에 해당하는 우리집으로 이동
    func reloadKitchens(select id: String?) async {
        guard let uid = userId else { return }
        do {
            let ms = try await Repository.memberships(userId: uid)
            applyMemberships(ms, select: id)
            await loadHousehold()
        } catch { reportSyncFailure(error) }
    }

    /// 지금 우리집의 가족·레시피·냉장고·장보기를 서버에서 읽어 화면에 반영한다
    func loadHousehold() async {
        guard let hid = currentHouseholdId, let uid = userId else { return }
        do {
            async let remoteMembers = Repository.members(of: hid)
            async let remoteRecipes = Repository.recipes(household: hid)
            async let remoteFridge = Repository.fridge(household: hid)
            async let remoteShop = Repository.shopping(household: hid)
            let (rm, rr, rf, rs) = try await (remoteMembers, remoteRecipes, remoteFridge, remoteShop)

            let people = rm.map { Member(remote: $0, myUserId: uid) }
            let names = Dictionary(people.compactMap { m in m.userId.map { ($0, m.name) } }, uniquingKeysWith: { a, _ in a })
            let newRecipes = rr.map { Recipe(remote: $0, authorName: names[$0.created_by ?? ""] ?? "") }
            let newFridge = rf.map(FridgeItem.init(remote:))
            let newShop = rs.map(ShopItem.init(remote:))

            // 스냅샷을 먼저 맞춘 뒤 화면 값을 바꿔야, 방금 읽어 온 값이 "변경"으로 다시 전송되지 않는다
            sync = SyncState(householdId: hid,
                             recipes: Dictionary(newRecipes.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a }),
                             fridge: Dictionary(newFridge.map { ($0.name, $0) }, uniquingKeysWith: { a, _ in a }),
                             shop: Dictionary(newShop.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a }),
                             topPosition: min(0, rr.compactMap(\.position).min() ?? 0))
            kitchens[currentKitchen].members = people
            recipes = newRecipes; fridge = newFridge; shop = newShop
            Task { await PushManager.shared.syncToken() }
        } catch {
            reportSyncFailure(error)
        }
    }

    private func importGuest(_ r: [Recipe], _ f: [FridgeItem], _ s: [ShopItem]) {
        guard !(r.isEmpty && f.isEmpty && s.isEmpty) else { return }
        sync.suppressNotify = true
        let valid = r.filter { UUID(uuidString: $0.id) != nil }
        let myName = members.first(where: \.isMe)?.name ?? ""
        for var rec in valid.reversed() where !recipes.contains(where: { $0.id == rec.id }) {
            rec.author = myName
            recipes.insert(rec, at: 0)
        }
        for item in f where !fridge.contains(where: { $0.name == item.name }) { fridge.append(item) }
        for item in s where !shop.contains(where: { $0.name == item.name }) { shop.append(item) }
        showToast("이 기기에 저장해 둔 내용을 내 계정으로 옮겼어요")
    }

    /// 앱이 다시 앞으로 올 때: 가족이 바꾼 내용을 받아온다 (내가 보낼 변경이 남아 있으면 건너뛴다)
    func refreshIfNeeded() async {
        guard isRemote, !sync.pushing, !(saveTask.map { !$0.isCancelled } ?? false) else { return }
        await loadHousehold()
    }

    /// AI 가 레시피를 저장한 뒤: 서버에 새로 생긴 레시피만 목록 맨 위에 추가한다
    func mergeRemoteRecipes() async {
        guard isRemote, let hid = currentHouseholdId else { return }
        do {
            let remote = try await Repository.recipes(household: hid)
            for r in remote.reversed() where sync.recipes[r.id.lowercased()] == nil {
                let rec = Recipe(remote: r, authorName: members.first { $0.userId == r.created_by }?.name ?? "")
                sync.recipes[rec.id] = rec
                recipes.insert(rec, at: 0)
            }
        } catch { reportSyncFailure(error) }
    }

    func refreshShopping() async {
        guard isRemote, let hid = currentHouseholdId else { return }
        do {
            let rs = try await Repository.shopping(household: hid).map(ShopItem.init(remote:))
            sync.shop = Dictionary(rs.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
            shop = rs
        } catch { reportSyncFailure(error) }
    }

    /// https://ourhomemenu.vercel.app/join?code=XXXX (유니버설 링크) 로 앱이 열렸을 때
    func handleURL(_ url: URL) {
        guard url.path.hasPrefix("/join") || url.host == "join",
              let code = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "code" })?.value,
              !code.isEmpty else { return }
        if isRemote {
            tab = .chat
            joinKitchen(code: code)
        } else {
            pendingInviteCode = code
            tab = .my
            showToast("로그인하면 바로 초대받은 우리집에 참여해요")
        }
    }

    /// 회원 탈퇴 (서버의 delete_my_account RPC). App Store 규정상 앱 안에서 계정을 지울 수 있어야 한다
    func deleteAccount() async {
        do {
            await PushManager.shared.unregisterToken()
            try await Backend.shared.rpcVoid("delete_my_account")
            await auth.signOut()
            showToast("탈퇴했어요. 그동안 이용해 주셔서 감사해요")
        } catch {
            showToast("탈퇴하지 못했어요. 잠시 후 다시 시도해주세요")
        }
    }

    func signOut() async {
        await PushManager.shared.unregisterToken()
        await auth.signOut()
        showToast("로그아웃했어요")
    }
}

// MARK: - AI 셰프 (서버의 /api/ai/assistant)

extension Store {
    private var linkProgressTexts: [String] {
        ["📹 영상 정보와 조리 과정을 읽고 있어요...", "🥕 재료와 정확한 계량을 정리하는 중이에요...", "🍳 \(kitchenName) 레시피북에 예쁘게 저장 중이에요..."]
    }

    func askAI() async {
        guard let hid = currentHouseholdId else { return }
        let gen = chatGen
        // 지금까지의 대화(나와 AI 셰프의 말)를 서버에 같이 보낸다
        let history: [(role: String, text: String)] = msgs.suffix(20).compactMap { m in
            guard m.separator == nil, let t = m.text, !t.isEmpty else { return nil }
            if m.fromMe { return ("user", t) }
            return m.mate == nil ? ("assistant", t) : nil
        }
        typing = true
        progress = nil
        defer { if gen == chatGen { typing = false; progress = nil } }

        do {
            for try await event in AssistantAPI.chat(messages: history, householdId: hid) {
                guard gen == chatGen else { return }
                switch event {
                case .step(let n):
                    progress = linkProgressTexts[min(max(n, 1), 3) - 1]
                case .result(let reply, let usage):
                    applyUsage(usage)
                    await show(reply)
                case .error(let message, let limitReached, let usage):
                    if let usage { applyUsage(usage) }
                    push(Msg(fromMe: false, text: limitReached ? "이번 주 AI 사용 한도에 도달했어요. \(message)" : message, mood: "puzzled"))
                }
            }
        } catch {
            guard gen == chatGen else { return }
            let message = (error as? BackendError).map { err -> String in
                if case .http(let code, _) = err, code == 401 { return "로그인이 만료됐어요. 다시 로그인해주세요." }
                return err.localizedDescription
            } ?? "연결이 불안정해요. 잠시 후 다시 시도해주세요."
            push(Msg(fromMe: false, text: message, mood: "puzzled"))
        }
    }

    func applyUsage(_ u: AssistantUsage) {
        aiPercent = u.percent; aiBonus = u.bonusRemaining; aiUnlimited = u.unlimited
    }

    private func show(_ reply: AssistantReply) async {
        if !reply.text.isEmpty {
            push(Msg(fromMe: false, text: reply.text, mood: reply.recipes.isEmpty ? (reply.ideas.isEmpty ? "chef-greeting" : "idea") : "excited"))
        }
        if !reply.recipes.isEmpty {
            await mergeRemoteRecipes()   // 서버가 방금 저장한 레시피를 목록에 가져온다
            for card in reply.recipes where recipe(card.id.lowercased()) != nil {
                push(Msg(fromMe: false, card: .recipe(card.id.lowercased()), mood: "thumbs-up"))
            }
        }
        for idea in reply.ideas { push(Msg(fromMe: false, card: .idea(idea), mood: "idea")) }
        if !reply.actions.isEmpty { push(Msg(fromMe: false, actions: reply.actions)) }
    }

    /// 새 메뉴 폼의 "AI로 재료·레시피 자동 작성": 서버가 링크를 분석해 레시피북에 저장한다. 저장되면 true
    func aiSaveLink(_ link: String) async -> Bool {
        guard isRemote, let hid = currentHouseholdId else { showToast("AI 자동 작성은 로그인하면 쓸 수 있어요"); return false }
        do {
            for try await event in AssistantAPI.chat(messages: [("user", link)], householdId: hid) {
                switch event {
                case .step: break
                case .result(let reply, let usage):
                    applyUsage(usage)
                    guard !reply.recipes.isEmpty else { showToast(reply.text.isEmpty ? "레시피를 찾지 못했어요" : reply.text); return false }
                    await mergeRemoteRecipes()
                    showToast("AI가 레시피를 저장했어요")
                    return true
                case .error(let message, _, let usage):
                    if let usage { applyUsage(usage) }
                    showToast(message)
                    return false
                }
            }
        } catch { showToast((error as? BackendError)?.localizedDescription ?? "연결이 불안정해요") }
        return false
    }

    /// AI 가 제안한 레시피를 우리집 레시피북에 저장
    func saveIdea(_ idea: AssistantIdea) {
        guard let hid = currentHouseholdId, !savedIdeas.contains(idea) else { return }
        savedIdeas.insert(idea)
        Task {
            do {
                let id = try await AssistantAPI.saveIdea(idea, householdId: hid)
                await mergeRemoteRecipes()
                showToast("저장했어요")
                push(Msg(fromMe: false, card: .recipe(id.lowercased()), mood: "excited"))
            } catch {
                savedIdeas.remove(idea)
                showToast("레시피를 저장하지 못했어요")
            }
        }
    }

    func perform(_ action: AssistantAction) {
        switch action {
        case .addShopping(_, let items):
            guard let hid = currentHouseholdId else { return }
            Task {
                do {
                    try await AssistantAPI.addShopping(items: items, householdId: hid)
                    await refreshShopping()
                    showToast("장보기에 담았어요")
                } catch { showToast("장보기에 담지 못했어요") }
            }
        case .prompt(_, let prompt, let mode):
            if mode == "fill" { draft = prompt } else { submit(prompt) }
        }
    }
}

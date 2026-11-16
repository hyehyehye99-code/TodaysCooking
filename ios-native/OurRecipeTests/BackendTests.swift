import XCTest
@testable import OurRecipe

final class PKCETests: XCTestCase {
    /// RFC 7636 부록 B 의 공식 예시값
    func testChallengeMatchesRFC7636Vector() {
        XCTAssertEqual(PKCE.challenge(for: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
                       "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
    }

    func testVerifierIsURLSafeAndLongEnough() {
        let v = PKCE.makeVerifier()
        XCTAssertGreaterThanOrEqual(v.count, 43)
        XCTAssertNil(v.rangeOfCharacter(from: CharacterSet(charactersIn: "+/=")))
        XCTAssertNotEqual(v, PKCE.makeVerifier())
    }
}

final class AssistantEventTests: XCTestCase {
    func testStepEvent() {
        guard case .step(let n)? = AssistantEvent.parse(#"{"type":"step","step":2}"#) else { return XCTFail() }
        XCTAssertEqual(n, 2)
    }

    func testResultEventWithRecipeAndActions() {
        let line = #"""
        {"type":"result","reply":{"text":"저장했어요","recipes":[{"id":"abc","title":"짜파게티","emoji":"🍝","summary":"s","ingredients":["면"],"ownedCount":1,"totalCount":3}],"ideas":[],"actions":[{"kind":"add_shopping","label":"장보기 담기","items":["새우"]},{"kind":"prompt","label":"더 보기","prompt":"더 알려줘","mode":"fill"}]},"usage":{"percent":12.5,"bonusRemaining":3,"unlimited":false}}
        """#
        guard case .result(let reply, let usage)? = AssistantEvent.parse(line) else { return XCTFail("parse") }
        XCTAssertEqual(reply.text, "저장했어요")
        XCTAssertEqual(reply.recipes.first?.totalCount, 3)
        XCTAssertEqual(reply.actions.count, 2)
        XCTAssertEqual(reply.actions[0], .addShopping(label: "장보기 담기", items: ["새우"]))
        XCTAssertEqual(reply.actions[1], .prompt(label: "더 보기", prompt: "더 알려줘", mode: "fill"))
        XCTAssertEqual(usage.bonusRemaining, 3)
    }

    func testErrorEventKeepsLimitFlag() {
        guard case .error(let message, let limit, _)? = AssistantEvent.parse(#"{"type":"error","error":"한도 초과","limitReached":true}"#) else { return XCTFail() }
        XCTAssertEqual(message, "한도 초과")
        XCTAssertTrue(limit)
    }

    func testGarbageLinesAreIgnored() {
        XCTAssertNil(AssistantEvent.parse("not json"))
        XCTAssertNil(AssistantEvent.parse(#"{"type":"unknown"}"#))
    }
}

final class RemoteMappingTests: XCTestCase {
    private func decodeRecipe(_ json: String) throws -> RemoteRecipe {
        try JSONDecoder().decode(RemoteRecipe.self, from: Data(json.utf8))
    }

    func testRecipeMapsNotesToStepsAndBookmarkToLink() throws {
        let remote = try decodeRecipe(#"""
        {"id":"11111111-1111-1111-1111-111111111111","household_id":"h","title":"감바스","subtitle":"간단","cook_time_minutes":20,
         "cover_photo_urls":[],"icon_emoji":null,"tags":["저녁","특별한"],"notes":"1. 오일을 두르고 볶아요\n2. 5분 끓여요","position":-3,
         "is_favorite":true,"hide_ingredients":false,"created_by":"u1",
         "recipe_ingredients":[{"id":"i2","name":"마늘","amount":"5개","position":1,"skipped":true},{"id":"i1","name":"새우","amount":"6마리","position":0,"skipped":false}],
         "bookmarks":[{"url":"https://www.instagram.com/reel/x","title":"마놉 레시피","domain":"instagram.com","thumbnail_url":"https://img/x.jpg"}]}
        """#)
        let r = Recipe(remote: remote, authorName: "혜콩")
        XCTAssertEqual(r.title, "감바스")
        XCTAssertEqual(r.tags, ["저녁", "특별한"])
        XCTAssertEqual(r.time, "20분")
        XCTAssertEqual(r.ings.map(\.name), ["새우", "마늘"], "position 순서로 정렬")
        XCTAssertEqual(r.skipped, ["마늘"])
        XCTAssertEqual(r.steps.count, 2)
        XCTAssertEqual(r.steps[1].timer, 300, "'5분' 이 있으면 타이머가 붙는다")
        XCTAssertEqual(r.link, "https://www.instagram.com/reel/x")
        XCTAssertEqual(r.photoURL, "https://img/x.jpg", "커버가 없으면 링크 썸네일")
        XCTAssertTrue(r.fav)
        XCTAssertEqual(r.author, "혜콩")
    }

    func testLinkOnlyRecipeHasNoTitle() throws {
        let remote = try decodeRecipe(#"{"id":"22222222-2222-2222-2222-222222222222","household_id":"h","title":null,"cover_photo_urls":null,"tags":null,"is_favorite":false,"bookmarks":[{"url":"https://youtu.be/x","title":"영상 제목","domain":"youtu.be","thumbnail_url":null}]}"#)
        let r = Recipe(remote: remote, authorName: "")
        XCTAssertTrue(r.isLinkOnly)
        XCTAssertEqual(r.displayTitle, "영상 제목")
        XCTAssertTrue(r.ings.isEmpty)
    }

    func testFridgePrefersConsumeByOverExpiresOn() throws {
        let item = try JSONDecoder().decode(RemoteFridgeItem.self, from: Data(#"{"id":"33333333-3333-3333-3333-333333333333","name":"두부","category":null,"in_stock":true,"expires_on":"2026-12-10","consume_by":"2026-12-05"}"#.utf8))
        let f = FridgeItem(remote: item)
        XCTAssertEqual(DateOnly.string(f.expiry!), "2026-12-05")
        XCTAssertEqual(f.id, UUID(uuidString: "33333333-3333-3333-3333-333333333333"))
    }

    func testDateOnlyRoundTrip() {
        let d = DateOnly.parse("2026-11-20")
        XCTAssertNotNil(d)
        XCTAssertEqual(DateOnly.string(d!), "2026-11-20")
        XCTAssertNil(DateOnly.parse(nil))
        XCTAssertNil(DateOnly.parse("bad"))
    }

    func testSyncFieldsIgnoreScreenOnlyState() throws {
        let remote = try decodeRecipe(#"{"id":"44444444-4444-4444-4444-444444444444","household_id":"h","title":"a","is_favorite":false}"#)
        var a = Recipe(remote: remote, authorName: "")
        var b = a
        b.chipFridge = ["두부"]     // 화면 전용 값
        XCTAssertEqual(a.syncFields, b.syncFields)
        b.fav = true
        XCTAssertNotEqual(a.syncFields, b.syncFields)
        XCTAssertEqual(a.syncFields.withoutFav, b.syncFields.withoutFav, "즐겨찾기만 바뀌면 가벼운 업데이트로 보낸다")
        a.skipped = ["두부"]
        XCTAssertEqual(a.syncFields.withoutFavAndSkipped, b.syncFields.withoutFavAndSkipped)
    }
}

final class ParsingTests: XCTestCase {
    func testIngredientParsing() {
        let r = Store.parseIngredients("파마산 치즈 80g\n김치\n  \n두부 1/2모")
        XCTAssertEqual(r.map(\.name), ["파마산 치즈", "김치", "두부"])
        XCTAssertEqual(r.map(\.amt), ["80g", "", "1/2모"])
    }

    func testStepParsingStripsNumberAndFindsTimer() {
        let s = Store.parseSteps("1. 면을 삶아요 8분\n2) 소스를 만들어요\n그냥 문장")
        XCTAssertEqual(s.map(\.text), ["면을 삶아요 8분", "소스를 만들어요", "그냥 문장"])
        XCTAssertEqual(s[0].timer, 480)
        XCTAssertNil(s[1].timer)
    }
}

final class BackendTests: XCTestCase {
    func testErrorMessageExtraction() {
        XCTAssertEqual(Backend.message(from: Data(#"{"message":"JWT expired"}"#.utf8)), "JWT expired")
        XCTAssertEqual(Backend.message(from: Data(#"{"error_description":"bad code"}"#.utf8)), "bad code")
        XCTAssertEqual(Backend.message(from: Data("oops".utf8)), "")
    }

    func testJSONValueEncodesNullAndNested() throws {
        let data = try JSONEncoder().encode(["a": JSONValue.null, "b": .array([.int(1), .string("x")]), "c": .bool(true)])
        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        XCTAssertTrue(obj?["a"] is NSNull)
        XCTAssertEqual((obj?["b"] as? [Any])?.count, 2)
        XCTAssertEqual(obj?["c"] as? Bool, true)
    }

    /// 세션이 없으면 네트워크에 나가기 전에 안전하게 실패해야 한다 (설정이 있으면 notSignedIn, 없으면 notConfigured)
    func testRequestWithoutSessionFailsBeforeAnyNetworkCall() async {
        let backend = Backend(urlSession: .shared, restoreSession: false)
        do { _ = try await backend.send("GET", path: "rest/v1/recipes"); XCTFail("should throw") }
        catch BackendError.notConfigured { /* 설정 없는 빌드 */ }
        catch BackendError.notSignedIn { /* 설정 있는 빌드 */ }
        catch { XCTFail("unexpected \(error)") }
    }
}

final class FridgeItemTests: XCTestCase {
    func testDDayText() {
        XCTAssertEqual(FridgeItem(name: "a", amt: "", days: 0).ddayText, "D-DAY")
        XCTAssertEqual(FridgeItem(name: "a", amt: "", days: 3).ddayText, "D-3")
        XCTAssertEqual(FridgeItem(name: "a", amt: "", days: -2).ddayText, "D+2")
        XCTAssertNil(FridgeItem(name: "a", amt: "", days: nil).ddayText)
        XCTAssertTrue(FridgeItem(name: "a", amt: "", days: -1).isSoon)
        XCTAssertFalse(FridgeItem(name: "a", amt: "", days: 10).isSoon)
    }
}

final class SharedLinkTests: XCTestCase {
    func testPlainURL() {
        XCTAssertEqual(SharedLink.firstURL(in: "https://youtu.be/abc123"), "https://youtu.be/abc123")
    }

    func testInstagramTextWithCaption() {
        let text = "이 릴스 대박 https://www.instagram.com/reel/Cxyz/?igsh=MWx1 꼭 봐"
        XCTAssertEqual(SharedLink.firstURL(in: text), "https://www.instagram.com/reel/Cxyz/?igsh=MWx1")
    }

    func testTrailingPunctuationIsTrimmed() {
        XCTAssertEqual(SharedLink.firstURL(in: "보세요 (https://youtu.be/abc)."), "https://youtu.be/abc")
        XCTAssertEqual(SharedLink.firstURL(in: "https://a.com/x」"), "https://a.com/x")
    }

    func testNoLink() {
        XCTAssertNil(SharedLink.firstURL(in: "링크 없는 글"))
        XCTAssertNil(SharedLink.firstURL(in: ""))
    }

    func testAISupportedHostsMatchTheWeb() {
        XCTAssertTrue(SharedLink.isAISupported("https://www.youtube.com/watch?v=1"))
        XCTAssertTrue(SharedLink.isAISupported("https://m.youtube.com/watch?v=1"))
        XCTAssertTrue(SharedLink.isAISupported("https://youtu.be/1"))
        XCTAssertTrue(SharedLink.isAISupported("https://www.instagram.com/reel/x"))
        XCTAssertFalse(SharedLink.isAISupported("https://blog.naver.com/x"))
        XCTAssertFalse(SharedLink.isAISupported("https://notyoutube.com/x"))
    }

    func testHostStripsWww() {
        XCTAssertEqual(SharedLink.host(of: "https://www.instagram.com/p/1"), "instagram.com")
    }
}

final class PushAPITests: XCTestCase {
    func testRequestBodiesMatchTheServerRoute() {
        XCTAssertEqual(PushAPI.Event.shoppingAdded(["우유", "식빵"]).body["kind"] as? String, "shopping_added")
        XCTAssertEqual(PushAPI.Event.shoppingAdded(["우유", "식빵"]).body["names"] as? [String], ["우유", "식빵"])
        XCTAssertEqual(PushAPI.Event.shoppingCompleted(3).body["count"] as? Int, 3)
        let p = PushAPI.Event.recipeProposed(id: "abc", title: "된장찌개", note: "")
        XCTAssertEqual(p.body["kind"] as? String, "recipe_proposed")
        XCTAssertNil(p.body["note"], "빈 메모는 보내지 않는다")
        XCTAssertEqual(PushAPI.Event.recipeProposed(id: "a", title: "t", note: "오늘 저녁").body["note"] as? String, "오늘 저녁")
    }
}

@MainActor
final class NotificationRoutingTests: XCTestCase {
    func testNotificationPathsOpenTheRightScreen() {
        let store = Store()
        store.routeNotification("/shopping")
        XCTAssertEqual(store.tab, .shop)

        store.routeNotification("/mypage/fridge")
        XCTAssertEqual(store.tab, .chat)
        XCTAssertTrue(store.showFridge)

        store.routeNotification("/recipes/ABC-123")
        XCTAssertEqual(store.tab, .recipes)
        XCTAssertEqual(store.recipePath, [.detail("abc-123")])

        store.routeNotification("/")
        XCTAssertEqual(store.tab, .chat)
    }
}

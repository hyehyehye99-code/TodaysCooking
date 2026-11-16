# 우리집 레시피 — 네이티브 iOS 앱 (SwiftUI)

기존 Capacitor 앱(`../ios/`)을 대체하는 네이티브 앱이에요. 같은 Supabase 백엔드와 같은 번들 ID(`ourhomemenu`)를 써서
기존 사용자의 계정·데이터가 그대로 이어져요.

## 처음 한 번만

```bash
brew install xcodegen
cd ios-native
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig   # 값 채우기 (git 에 올라가지 않음)
xcodegen generate                                             # OurRecipe.xcodeproj 생성 (git 제외)
open OurRecipe.xcodeproj
```

`Secrets.xcconfig` 의 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 는 웹의 `.env.local` 에 있는
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 와 같은 값이에요(공개 키).
**service role key, GEMINI/YOUTUBE/COUPANG 키는 앱에 절대 넣지 않아요** — AI 는 웹 서버가 대신 호출해요.
값이 비어 있으면 앱은 로그인 없이 쓰는 게스트(기기 저장) 모드로만 동작해요.

> xcconfig 에서는 `//` 가 주석이라 URL 은 `https:/$()/host` 로 적어요 (예시 파일 참고).

## 구조

| 폴더/파일 | 역할 |
|---|---|
| `OurRecipe/*.swift` | 화면(SwiftUI) · `Store.swift` 앱 상태 |
| `OurRecipe/Backend/` | Supabase 클라이언트(`Backend`), 로그인(`AuthManager`, OAuth PKCE), 테이블 접근(`Repository`), AI(`AssistantAPI`), 서버 행 ↔ 화면 모델 변환(`RemoteMapping`) |
| `OurRecipe/Store+Remote.swift` | 로컬 저장, 변경 감지 동기화(diff), 로그인/게스트 데이터 이전, AI 대화 처리 |
| `OurRecipeTests/` | 단위 테스트 (`xcodebuild test`) |
| `Config/` | 빌드 설정 (`Secrets.xcconfig` 는 git 제외) |
| `project.yml` | XcodeGen 설정 — 번들 ID·권한·버전의 원본 |

### 동작 방식

- **게스트**: 레시피·냉장고·장보기를 기기(`Application Support/OurRecipe/local.json`)에만 저장해요. 링크 저장은 되고, AI 정리는 로그인 후에 쓸 수 있어요.
- **로그인**: Google · Apple · Kakao (Supabase OAuth + PKCE, 리다이렉트 `com.hyeji.ourmenu://auth/callback` — 기존 앱과 같아서 Supabase 설정 변경 없음). 세션은 키체인에 저장돼요.
- **데이터**: 앱이 사용자 JWT 로 Supabase 에 직접 접근해요(웹의 RLS 정책 그대로 적용). 웹의 서버 액션은 쓰지 않아요.
- **동기화**: 화면 값이 바뀌면 `Store+Remote` 가 "서버에 마지막으로 반영된 모양"과 비교해서 달라진 것만 보내요(레시피 생성/수정/삭제, 즐겨찾기, 재료 생략, 냉장고, 장보기). 로컬에서 만든 uuid 를 서버 행 id 로 그대로 써서 매핑 테이블이 필요 없어요.
- **AI**: `POST {API_BASE_URL}/api/ai/assistant` (NDJSON 스트림). 링크 분석·대화·레시피 저장·장보기 담기가 모두 이 한 곳으로 가요.

### DB 와 화면의 차이 (알아둘 점)

- 서버 `fridge_items`/`shopping_items` 에는 **수량 칸이 없어요** → 로그인 상태에서는 수량이 저장되지 않아요.
- 레시피 태그는 자유 문자열이에요(한식/양식 같은 고정 분류 아님). 만드는 법은 `notes` 한 덩어리라서 줄 단위로 단계를 만들어요.
- 냉장고 날짜는 서버의 유통기한/소비기한 두 컬럼에 같은 값으로 써요(읽을 땐 `consume_by` 우선).
- 냉장고에서 "빼기"는 행을 지우지 않고 `in_stock=false` 로 바꿔요(웹과 같은 방식).

## 테스트

```bash
xcodebuild -project OurRecipe.xcodeproj -scheme OurRecipe \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

DEBUG 빌드에서는 화면 확인용 실행 인자(`-sample YES`, `-tab my`, `-fridge YES` …)를 쓸 수 있어요. Release 빌드에는 포함되지 않아요.

# 배포 체크리스트 (네이티브 앱 → App Store)

기존 App Store 앱(Capacitor, v1.2 / build 26)을 **같은 번들 ID(`ourhomemenu`)로 업데이트**하는 방식이에요.
버전은 `2.0.0` (build `27`) 로 시작해요 (`project.yml` 의 `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`).

## 0. 배포 전에 꼭 해야 하는 것 (코드로 할 수 없는 것)

- [ ] **웹 서버(Vercel)에 Bearer 토큰 지원 배포** — `src/lib/supabase/server.ts`, `src/lib/household.ts` 변경(커밋 `1cbf9fc`)이 배포돼야 앱에서 AI 가 동작해요. 배포 전에는 앱의 AI 요청이 401 이에요.
- [ ] **실제 계정으로 로그인 → 레시피/냉장고/장보기 → AI 한 바퀴 직접 확인** (이 저장소의 테스트는 서버 없이 도는 단위 테스트라, 실서버 왕복은 로그인이 필요해서 자동으로 검증하지 못했어요).
- [ ] Apple Developer 에서 App ID `ourhomemenu` 에 **Push Notifications**, **Associated Domains** 가 켜져 있는지 확인 (기존 앱과 같은 App ID 라 이미 돼 있을 거예요).
- [ ] 심사용 **테스트 계정** 준비 + App Store Connect "심사 메모"에 안내 (로그인 없이도 쓸 수 있는 게스트 모드가 있다는 점 포함).

## 1. 빌드 · 업로드

1. `Config/Secrets.xcconfig` 에 **운영** Supabase URL/anon key, `API_BASE_URL=https://ourhomemenu.vercel.app` 확인.
2. `xcodegen generate` → Xcode 에서 `OurRecipe` 스킴, 대상 `Any iOS Device (arm64)`.
3. Signing & Capabilities: Team `6NTUXY85FS`, Automatic signing.
4. **Product → Archive → Distribute App → App Store Connect (Upload)**.
5. TestFlight 내부 테스트로 먼저 확인 후 심사 제출.

(터미널 확인용: `xcodebuild -scheme OurRecipe -destination 'generic/platform=iOS' -configuration Release build` 는 서명 없이도 통과해요.)

## 2. 이미 준비된 것

- 번들 ID / 팀 / 버전 / URL 스킴(`com.hyeji.ourmenu`) / 푸시·유니버설 링크 권한(`OurRecipe.entitlements`)
- 개인정보 매니페스트 `PrivacyInfo.xcprivacy` (추적 없음 · 이메일/사용자 ID/사용자 콘텐츠는 앱 기능 목적)
- 수출 규정 `ITSAppUsesNonExemptEncryption = false`
- **앱 안 회원 탈퇴** (마이페이지 → 계정 관리 → 회원 탈퇴, 서버 `delete_my_account`) — 심사 필수 항목
- Google/Kakao 로그인과 함께 **Apple 로그인** 제공 (심사 4.8)
- 사진 저장 권한 문구, 앱 아이콘, 한국어 현지화
- 디버그 전용 실행 인자는 Release 에서 제거됨 (`#if DEBUG`)
- App Store 스크린샷/문구 초안: `../design/app-store/`

## 3. 아직 연결 안 된 기능 (출시 전 범위 결정 필요)

| 기능 | 상태 |
|---|---|
| 푸시 알림(FCM) | 토큰 등록 미구현 — 가족이 장보기 추가 시 알림 등 |
| 타이머 | 기기 안에서만 동작·저장 (서버 `timers` 미연동), 백그라운드 알림/Live Activity 없음 |
| 메뉴판 | 기기 안에서만 저장 (서버 `meal_plans` 미연동). 이미지 저장·공유는 동작 |
| 활동 로그 | 화면은 샘플 문구 (서버 `household_activity` 미연동) |
| 태그 이름 바꾸기 / 프로필 아이콘 | 미구현 |
| 구독(RevenueCat) | 미구현 |
| 공유 확장(Share Extension) · 위젯 | 기존 `../ios/` 에만 있음 — 네이티브로 이식 필요 |
| 가족이 바꾼 내용 | 앱이 앞으로 올 때 새로고침 (실시간 반영 아님) |
| 레시피 사진 업로드 | 서버 사진 **보기**만 가능, 앱에서 올리기 미구현 |

> 기존 `../ios/` 폴더는 위 기능(공유 확장·위젯)을 이식하기 전까지 지우지 마세요.

# 배포 체크리스트 (네이티브 앱 → App Store)

기존 App Store 앱(Capacitor, v1.2 / build 26)을 **같은 번들 ID(`ourhomemenu`)로 업데이트**하는 방식이에요.
버전은 `2.0.0` (build `27`) 로 시작해요 (`project.yml` 의 `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`).

## 0. 배포 전에 꼭 해야 하는 것 (코드로 할 수 없는 것)

- [ ] **웹 서버(Vercel)에 Bearer 토큰 지원 배포** — `src/lib/supabase/server.ts`, `src/lib/household.ts` 변경(커밋 `1cbf9fc`)이 배포돼야 앱에서 AI 가 동작해요. 배포 전에는 앱의 AI 요청이 401 이에요.
- [ ] **실제 계정으로 로그인 → 레시피/냉장고/장보기 → AI 한 바퀴 직접 확인** (이 저장소의 테스트는 서버 없이 도는 단위 테스트라, 실서버 왕복은 로그인이 필요해서 자동으로 검증하지 못했어요).
- [ ] Apple Developer 에서 App ID `ourhomemenu` 에 **Push Notifications**, **Associated Domains** 가 켜져 있는지 확인 (기존 앱과 같은 App ID 라 이미 돼 있을 거예요).
- [ ] 심사용 **테스트 계정** 준비 + App Store Connect "심사 메모"에 안내 (로그인 없이도 쓸 수 있는 게스트 모드가 있다는 점 포함).

## 1. 빌드 · 업로드 (터미널에서 그대로 성공한 절차)

2.0.0 (build 28) 을 이 방법으로 TestFlight 에 올렸어요 (2026-11-17).

```bash
cd ios-native
xcodegen generate

# 1) 아카이브 — 팀 6NTUXY85FS, 자동 서명
xcodebuild archive -project OurRecipe.xcodeproj -scheme OurRecipe -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build-archive/OurRecipe.xcarchive \
  -derivedDataPath build-archive/dd -allowProvisioningUpdates

# 2) App Store Connect 로 바로 업로드 (Xcode 에 로그인된 Apple 계정의 클라우드 배포 인증서를 사용)
xcodebuild -exportArchive -archivePath build-archive/OurRecipe.xcarchive \
  -exportOptionsPlist build-archive/ExportOptions.plist -exportPath build-archive/upload -allowProvisioningUpdates
```

`build-archive/ExportOptions.plist`: `method=app-store-connect`, `destination=upload`, `teamID=6NTUXY85FS`, `signingStyle=automatic`, `uploadSymbols=true`.
(파일로만 내보려면 `destination` 을 `export` 로 바꾸고, 서명은 `codesign -dvv` 로 `Authority=Apple Distribution` 인지 확인해요.)

업로드 후 App Store Connect → TestFlight 에서 처리(수 분~수십 분)가 끝나면 빌드가 나타나요. **수출 규정/암호화 질문은 `ITSAppUsesNonExemptEncryption=false` 라 자동 통과**예요.
버전/빌드 번호를 올릴 땐 `project.yml` 의 `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION` 을 고쳐요(같은 버전 안에서 빌드 번호는 매번 커야 해요).

### 배포하다 겪은 문제 (다시 만나지 않도록)

| 증상 | 원인 | 해결 |
|---|---|---|
| `90034 not signed using an Apple submission certificate` | `.app` 파일 이름이 한글(`우리집 레시피.app`)이라 클라우드 서명이 제대로 붙지 않았어요 | `PRODUCT_NAME=OurRecipe` (ASCII). 홈 화면 이름은 `CFBundleDisplayName` 이 정해서 그대로 "우리집 레시피" |
| `90474 No orientations were specified` | 유니버설 앱인데 아이패드 방향이 없었어요 | 아이패드 네 방향 지정 (`INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad`) |

### 기존 앱과 달라지는 점 (출시 전에 꼭 확인)

- **최소 iOS**: 기존 앱은 iOS 15 부터, 새 앱은 **iOS 17 부터**예요. 업데이트하면 iOS 15·16 사용자는 새 버전을 받지 못하고 기존 버전에 남아요. (낮추려면 `@Observable`·`SwiftData` 대체 등 코드 수정이 필요해요.)
- **위젯(TimerWidgetExtension)이 사라져요** — 아직 이식 전이라 새 버전을 설치하면 홈 화면의 타이머 위젯이 없어져요.
- **아이패드**: 아이폰 화면을 그대로 넓힌 모양이에요(전용 레이아웃 없음).

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
| 타이머 | 기기 안에서만 동작·저장 (서버 `timers` 미연동), 백그라운드 알림/Live Activity 없음 |
| 메뉴판 | 기기 안에서만 저장 (서버 `meal_plans` 미연동). 이미지 저장·공유는 동작 |
| 활동 로그 | 화면은 샘플 문구 (서버 `household_activity` 미연동) |
| 태그 이름 바꾸기 / 프로필 아이콘 | 미구현 |
| 구독(RevenueCat) | 미구현 |
| 위젯(TimerWidgetExtension) | 기존 `../ios/` 에만 있음 — 네이티브로 이식 필요 (타이머 Live Activity 포함) |
| 가족이 바꾼 내용 | 앱이 앞으로 올 때 새로고침 (실시간 반영 아님) |
| 레시피 사진 업로드 | 서버 사진 **보기**만 가능, 앱에서 올리기 미구현 |

> 기존 `../ios/` 폴더는 위젯을 이식하기 전까지 지우지 마세요.

## 4. 푸시 알림 · 공유 확장 (연결됨, 실기기 확인 필요)

- **푸시(FCM)**: 로그인하면 알림 권한을 묻고 `fcm_tokens` 에 이 기기 토큰을 등록해요(우리집을 바꾸면 따라가요). 알림은 웹 서버가 보내고, 앱은 `POST /api/push/notify` 로 "장보기 추가/완료", "요리 제안" 을 알려요. 알림을 누르면 해당 화면이 열려요. **시뮬레이터에는 APNs 토큰이 없어서 실제 기기에서만 확인할 수 있어요.**
- **공유 확장**: 유튜브·인스타그램 공유 시트에서 "우리집 레시피" → 앱을 열지 않고 AI 로 바로 레시피 생성. AI 를 쓸 수 없으면(한도/지원 안 하는 링크) 링크만 저장해요. 앱과 확장이 키체인 그룹(`$(AppIdentifierPrefix)ourhomemenu`)으로 로그인 세션을 공유해요.
- 푸시·AI 모두 웹 서버에 `/api/push/notify` 와 Bearer 지원(커밋 `e0420c7`, `1cbf9fc`)이 **배포돼 있어야** 해요.

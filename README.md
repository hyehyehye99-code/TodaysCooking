# 둘의 부엌

부부/커플이 함께 쓰는 레시피 · 냉장고 · 북마크 · 장보기 앱. Next.js(App Router) + Supabase.

## 처음 설정하기

1. **Supabase 프로젝트 만들기** — [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. **DB 스키마 적용** — Supabase 대시보드의 SQL Editor에서 `supabase/migrations/0001_init.sql` 내용을 실행합니다. (households, recipes, fridge_items, bookmarks, shopping_items 테이블과 RLS 정책이 생성됩니다.)
3. **이메일 로그인(Magic Link) 활성화 확인** — Supabase 대시보드 Authentication → Providers에서 Email이 켜져 있는지 확인합니다. 개발 중에는 Authentication → URL Configuration에 `http://localhost:3000/auth/callback`을 Redirect URL로 추가해주세요.
4. **환경 변수 설정**
   ```bash
   cp .env.local.example .env.local
   ```
   `.env.local`에 Supabase 프로젝트의 URL과 anon key를 입력합니다 (Project Settings → API).
5. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   [http://localhost:3000](http://localhost:3000) 접속 → 이메일로 로그인 → 가족 공간 만들기(또는 초대 코드로 참여) → 시작.

## 구조

- `src/app/(app)/` — 로그인 + 가족 공간이 있어야 접근 가능한 메인 4탭 (레시피/냉장고/북마크/장보기) + 설정
- `src/app/login`, `src/app/onboarding` — 로그인, 가족 공간 생성/참여
- `src/lib/actions/` — 데이터 변경용 Server Actions
- `src/lib/supabase/` — Supabase 클라이언트 (server/browser/proxy)
- `src/proxy.ts` — 세션 쿠키 갱신 (Next.js 16의 `middleware` → `proxy` 이름 변경 반영)
- `supabase/migrations/0001_init.sql` — DB 스키마 + RLS 정책
- `design/` — 초기 디자인 목업 (Claude Design 캔버스 소스, 실제 앱 코드와는 별개의 참고용 시안)

## 가족 초대

설정(⚙️) 탭에서 초대 코드를 발급하면, 상대방이 로그인 후 온보딩 화면에서 "초대 코드로 참여"로 같은 가족 공간에 들어올 수 있어요. 코드는 14일간 유효합니다.

## 배포

Vercel에 배포할 경우, 프로젝트 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`(배포 도메인)을 등록하고, Supabase Redirect URL에도 배포 도메인의 `/auth/callback`을 추가해야 합니다.

## 아직 안 된 것

- 레시피 수정, 북마크 링크 미리보기 실패 시 수동 입력

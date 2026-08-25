import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";

const HIGHLIGHT_FEATURES = [
  {
    title: "AI가 재료·레시피를 대신 정리해요",
    description: "유튜브·인스타·블로그 링크만 넣으면 재료와 만드는 법을 AI가 알아서 정리해요. 손으로 옮겨 적을 필요 없어요.",
    screenshot: "/screenshots/recipe-add-ai.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M5 4.5C5 3.67 5.67 3 6.5 3H16v15H6.5A1.5 1.5 0 015 16.5v-12z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M5 16.5A1.5 1.5 0 016.5 15H16" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8.5 7h4.5M8.5 10h4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "부족한 재료는 장보기로, 장보기는 다시 냉장고로",
    description: "레시피에 부족한 재료를 누르면 장보기 목록에 자동으로 담기고, 장보기를 끝내면 냉장고에도 알아서 반영돼요.",
    screenshot: "/screenshots/ingredient-check.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M4.5 6.5h13l-1.2 9.4a1.5 1.5 0 01-1.49 1.3H7.19a1.5 1.5 0 01-1.49-1.3L4.5 6.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M7.5 6.5a3.5 3.5 0 017 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "가족과 함께 쓰는 부엌",
    description: "초대 코드 하나로 가족을 부엌에 초대해요. 레시피도, 냉장고도, 장보기 목록도 다 같이 봐요.",
    screenshot: "/screenshots/shared-kitchen.png",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path d="M3 19c0-3 2.5-5.5 5-5.5S13 16 13 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M14.5 13.5c2.5 0 4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PAIN_POINTS = [
  "유튜브·인스타에 저장만 해두고, 막상 요리할 땐 어디 있는지 못 찾아요",
  "장 보러 가서는 뭘 사야 할지 헷갈려요",
  "냉장고를 열어봐도 뭐가 있는지 몰라서 요리를 미뤄요",
];

export default async function LandingPage() {
  const { user, household } = await getCurrentHousehold();
  if (user && household) redirect("/recipes");
  if (user && !household) redirect("/onboarding");

  return (
    <div className="h-dvh w-full overflow-y-auto overscroll-contain">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" width={28} height={28} />
          <span className="text-sm font-bold tracking-wide text-ink">우리집 메뉴판</span>
        </div>
        <Link href="/login" className="text-sm font-bold text-ink-soft">
          로그인
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 pb-20 pt-8 md:grid-cols-2 md:items-center md:pb-32 md:pt-16">
        <div>
          <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">우리집 메뉴판</p>
          <h1 className="text-[36px] font-bold leading-tight text-ink md:text-[48px]">
            흩어진 레시피를
            <br />
            <span className="text-accent">한곳에,</span>
            <br />
            필요한 재료를
            <br />
            <span className="text-accent">한눈에!</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">
            레시피 링크만 넣으면 AI가 재료를 정리하고, 부족한 재료는 장보기로, 장보기가 끝나면
            냉장고로 — 저절로 이어져요. 가족과 함께 쓰는 우리집 메뉴판.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-accent px-7 py-4 text-sm font-bold text-white"
            >
              웹으로 시작하기
            </Link>
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-7 py-4 text-sm font-bold text-ink-faint"
            >
              iOS 앱 (출시 예정)
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/recipe-list.png"
            alt="레시피 목록 화면 스크린샷"
            className="aspect-[466/893] w-full object-contain"
          />
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">이런 적, 있지 않나요?</h2>
          <div className="mt-8 flex flex-col gap-3">
            {PAIN_POINTS.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-border bg-cream px-5 py-4 text-sm font-semibold text-ink-soft md:text-base"
              >
                {point}
              </div>
            ))}
          </div>
          <p className="mt-8 text-base font-bold text-ink md:text-lg">
            그 불편함을 하나씩 없애다 보니, <span className="text-accent">우리집 메뉴판</span>이
            됐어요.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">이런 기능이 있어요</h2>

          <div className="mt-14 flex flex-col gap-16 md:gap-24">
            {HIGHLIGHT_FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`flex flex-col items-center gap-8 md:gap-14 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div className="w-full md:flex-1">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-ink md:text-xl">{f.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft md:text-base">
                    {f.description}
                  </p>
                </div>
                <div className="w-full md:flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.screenshot}
                    alt={`${f.title} 스크린샷`}
                    className="mx-auto aspect-[466/893] w-full max-w-[360px] object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto w-full max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-ink md:text-3xl">요금제</h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-ink-soft">
            핵심 기능은 언제나 무료예요. AI 자동 작성만 더 넉넉하게 쓰고 싶을 때 구독하시면 돼요.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-7">
              <p className="text-sm font-bold text-ink-faint">무료 플랜</p>
              <p className="mt-2 text-3xl font-bold text-ink">₩0</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                <li>· 레시피·냉장고·장보기 전 기능 무료</li>
                <li>· 가족과 함께 쓰는 부엌 무제한</li>
                <li>· AI 자동 작성 주 5회</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-accent p-7">
              <p className="text-sm font-bold text-accent">우리집 메뉴판 프리미엄</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                ₩2,900<span className="text-sm font-semibold text-ink-faint"> / 월</span>
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                <li>· 무료 플랜의 모든 기능</li>
                <li>· AI 자동 작성 월 100회</li>
                <li>· 한 번 구독으로 부엌 멤버 모두 함께 사용</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">지금, 무료로 시작해보세요</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            혼자여도, 가족과 함께여도 좋아요. 로그인 한 번이면 바로 시작할 수 있어요.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white"
            >
              웹으로 시작하기
            </Link>
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-8 py-4 text-sm font-bold text-ink-faint"
            >
              iOS 앱 (출시 예정)
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-ink-faint">
        © 2026 우리집 메뉴판
      </footer>
    </div>
  );
}

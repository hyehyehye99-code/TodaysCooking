import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";

const FEATURES = [
  {
    title: "AI가 재료·레시피를 대신 정리해요",
    description: "유튜브·인스타·블로그 링크만 넣으면 재료와 만드는 법을 AI가 알아서 정리해요. 손으로 옮겨 적을 필요 없어요.",
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
    title: "냉장고, 탭 한 번이면 끝",
    description: "지금 냉장고에 뭐가 있는지 탭 한 번으로 체크해요. 뭘 사야 할지 매번 고민할 필요 없어요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="5" y="3" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M5 9h12" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 5.5v1.5M8 11.5v1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "부족한 재료는 장보기로, 장보기는 다시 냉장고로",
    description: "레시피에 부족한 재료를 누르면 장보기 목록에 자동으로 담기고, 장보기를 끝내면 냉장고에도 알아서 반영돼요.",
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
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path d="M3 19c0-3 2.5-5.5 5-5.5S13 16 13 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M14.5 13.5c2.5 0 4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "가족이 장을 봤는지, 알림으로 바로 확인",
    description: "누가 장보기에 뭘 추가했는지, 장보기를 끝냈는지 알림으로 바로 알려드려요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M11 3.5a4.5 4.5 0 00-4.5 4.5v3l-1.5 3h12l-1.5-3v-3A4.5 4.5 0 0011 3.5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M9 16.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "메뉴판을 자랑해보세요",
    description: "메뉴판을 공개 링크로 공유하고, 방문자의 하트 반응도 받아볼 수 있어요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M11 18.5s-7-4.2-7-9.2a3.8 3.8 0 017-2.1 3.8 3.8 0 017 2.1c0 5-7 9.2-7 9.2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
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
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-accent px-7 py-4 text-sm font-bold text-white"
            >
              무료로 시작하기
            </Link>
            <p className="mt-3 text-xs text-ink-faint">가입 30초, 완전 무료예요.</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[300px]">
          <div className="rounded-[32px] border border-border bg-cream p-5 shadow-[0_20px_60px_-24px_rgba(25,31,40,0.25)]">
            <p className="mb-4 text-xs font-bold text-ink-faint">오늘의 냉장고</p>
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface text-ink-faint">
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <rect x="2.5" y="3.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="7.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 15.5l4.5-4.5 3 3 2.5-2.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold">스크린샷 자리</span>
            </div>
          </div>
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
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-cream p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.description}</p>
                <div className="mt-4 flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface text-ink-faint">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <rect x="2.5" y="3.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="7.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 15.5l4.5-4.5 3 3 2.5-2.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[11px] font-semibold">스크린샷 자리</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">지금, 무료로 시작해보세요</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            혼자여도, 가족과 함께여도 좋아요. 로그인 한 번이면 바로 시작할 수 있어요.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-ink-faint">
        © 2026 우리집 메뉴판
      </footer>
    </div>
  );
}

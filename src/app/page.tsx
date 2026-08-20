import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";

const FEATURES = [
  {
    title: "레시피 모아보기",
    description: "여기저기 흩어진 레시피를 한곳에 정리해요.",
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
    title: "냉장고 재료 관리",
    description: "지금 냉장고에 뭐가 있는지 한눈에 확인해요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="5" y="3" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M5 9h12" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 5.5v1.5M8 11.5v1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "북마크로 저장",
    description: "유튜브·블로그 레시피 링크를 저장해두고 나중에 찾아봐요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M6.5 3.5h9a1 1 0 011 1V19l-5.5-3.5L5.5 19V4.5a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "장보기 리스트",
    description: "필요한 재료를 담아 장보기 목록으로 정리해요.",
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
            레시피, 냉장고, 장보기 목록까지 — 파트너와 함께 쓰는 우리집 메뉴판.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-accent px-7 py-4 text-sm font-bold text-white"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[300px]">
          <div className="rounded-[32px] border border-border bg-cream p-5 shadow-[0_20px_60px_-24px_rgba(25,31,40,0.25)]">
            <p className="mb-4 text-xs font-bold text-ink-faint">오늘의 냉장고</p>
            <div className="space-y-2.5">
              {["감자", "대파", "두부", "계란"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
                >
                  <span className="text-sm font-bold text-ink">{item}</span>
                  <span className="text-xs text-ink-faint">냉장</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">이런 것도 할 수 있어요</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-cream p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-surface p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">초대 코드 하나로, 파트너와 함께</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              설정에서 초대 코드를 만들면 상대방이 코드를 입력해 같은 가족 공간에 들어와요. 레시피도,
              냉장고도, 장보기 목록도 함께 봐요.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-white"
          >
            시작하기
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-ink-faint">
        © 2026 우리집 메뉴판
      </footer>
    </div>
  );
}

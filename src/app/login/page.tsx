import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col justify-between px-7 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),100px)]">
      <div>
        <p className="mb-2 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
        <h1 className="mb-3 text-[32px] font-bold leading-tight">오늘은 내가 요리할게!</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          우리의 레시피를 한 곳에, 필요한 재료를 한 눈에!
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl bg-surface px-4 py-2.5">
          <span className="text-sm font-bold text-ink">내가!</span>
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-surface" />
        </div>
        <span className="text-[96px] leading-none">🙋</span>
      </div>

      <Link
        href="/login/start"
        className="rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
      >
        시작하기
      </Link>
    </div>
  );
}

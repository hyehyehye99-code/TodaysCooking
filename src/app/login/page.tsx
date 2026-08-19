import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col justify-between px-7 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),100px)]">
      <div>
        <p className="mb-2 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
        <h1 className="mb-3 text-[32px] font-bold leading-tight">오늘은 내가 요리할게!</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          요리책을 만들고, 냉장고 재료까지 준비하면 시작할 수 있어요.
        </p>
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

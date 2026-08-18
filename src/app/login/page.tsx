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

      <div className="flex flex-col gap-4">
        <Link
          href="/onboarding"
          className="rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
        >
          시작하기
        </Link>

        <div className="flex flex-col gap-2">
          <Link
            href="/guest/recipes"
            className="text-center text-sm font-bold text-ink-soft underline"
          >
            로그인 없이 둘러보기
          </Link>

          <Link
            href="/login/existing"
            className="text-center text-xs text-ink-faint underline"
          >
            이미 계정이 있으신가요? 바로 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}

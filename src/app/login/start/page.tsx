import Link from "next/link";

export default function LoginStartPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <Link href="/login" className="mb-6 self-start text-sm text-ink-soft">
        ← 뒤로
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-1 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
        <h1 className="mb-8 text-[26px] font-bold leading-tight">
          처음이신가요, 아니면
          <br />
          다시 오셨나요?
        </h1>

        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
          >
            회원가입 (처음이에요)
          </Link>
          <Link
            href="/login/existing"
            className="rounded-xl bg-surface py-4 text-center text-sm font-bold text-ink"
          >
            로그인 (계정이 있어요)
          </Link>
        </div>
      </div>
    </div>
  );
}

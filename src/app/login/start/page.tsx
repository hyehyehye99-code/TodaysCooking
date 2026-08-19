import Link from "next/link";
import { BackButton } from "@/components/ui";

export default function LoginStartPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col justify-between px-7 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),100px)]">
      <div>
        <BackButton href="/login" className="mb-12" />
        <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
        <h1 className="text-[28px] font-bold leading-tight">
          처음이신가요,
          <br />
          아니면 다시 오셨나요?
        </h1>
      </div>

      <span className="text-center text-[96px] leading-none">🤔</span>

      <div className="flex flex-col gap-6">
        <Link
          href="/onboarding"
          className="rounded-xl bg-accent py-4 text-center text-sm font-bold text-white"
        >
          회원가입 (처음이에요)
        </Link>
        <Link
          href="/login/existing"
          className="rounded-xl border border-accent bg-surface py-4 text-center text-sm font-bold text-accent-ink"
        >
          로그인 (계정이 있어요)
        </Link>
      </div>
    </div>
  );
}

import { GoogleSignInButton } from "./google-signin-button";

export default function LandingPage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),64px)]">
      <div>
        <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">오내요</p>
        <h1 className="mb-7 text-[32px] font-bold leading-tight">오늘은 내가 요리할게!</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          우리의 요리책을 한 곳에, 필요한 재료를 한 눈에!
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="relative rounded-2xl bg-surface px-4 py-2.5">
          <span className="text-sm font-bold text-ink">내가!</span>
          <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-surface" />
        </div>
        <span className="text-[96px] leading-none">🙋</span>
        <div className="w-full">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}

import { BackButton } from "@/components/ui";
import { GoogleSignInButton } from "./google-signin-button";
import { AppleSignInButton } from "./apple-signin-button";

export default function LandingPage() {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),64px)]">
      <div className="absolute left-7 top-[max(env(safe-area-inset-top),20px)]">
        <BackButton href="/welcome" />
      </div>

      <div className="flex-[1]" />

      <div>
        <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">우리집 메뉴판</p>
        <h1 className="text-[32px] font-bold leading-tight">
          흩어진 레시피를
          <br />
          <span className="text-accent">한곳에,</span>
          <br />
          필요한 재료를
          <br />
          <span className="text-accent">한 눈에!</span>
        </h1>

        <div className="mt-10 flex flex-col gap-2.5">
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>
      </div>

      <div className="flex-[1.8]" />
    </div>
  );
}

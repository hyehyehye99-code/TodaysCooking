import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { BackButton } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";
import { GoogleSignInButton } from "./google-signin-button";
import { AppleSignInButton } from "./apple-signin-button";
import { KakaoSignInButton } from "./kakao-signin-button";

export default async function LandingPage() {
  const [{ user, household }, { dict }] = await Promise.all([getCurrentHousehold(), getDictionary()]);
  if (user && household) redirect("/recipes");
  if (user && !household) redirect("/onboarding");

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[420px] flex-col px-7 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),64px)]">
      <div className="absolute left-7 top-[max(env(safe-area-inset-top),20px)]">
        <BackButton href="/welcome" />
      </div>

      <div className="flex-[1]" />

      <div>
        <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">우리집 레시피</p>
        <h1 className="text-[32px] font-bold leading-tight">
          {dict.landing.headline1}
          <br />
          <span className="text-accent">{dict.landing.headline2}</span>
          <br />
          {dict.landing.headline3}
          <br />
          <span className="text-accent">{dict.landing.headline4}</span>
        </h1>

        <div className="mt-10 flex flex-col gap-2.5">
          <GoogleSignInButton />
          <AppleSignInButton />
          <KakaoSignInButton />
        </div>
      </div>

      <div className="flex-[1.8]" />
    </div>
  );
}

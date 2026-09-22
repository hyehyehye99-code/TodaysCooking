import Link from "next/link";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui";
import { Mascot, type MascotName } from "@/components/Mascot";

const FEATURE_MASCOTS: MascotName[] = ["idea", "shopping", "love"];

const FEATURE_SCREENSHOTS = [
  "/screenshots/recipe-add-ai.png",
  "/screenshots/ingredient-check.png",
  "/screenshots/shared-kitchen.png",
];

export default async function LandingPage() {
  // No redirect here — this page doubles as the shareable marketing link
  // (see the landing/subscription pricing sections below), so it has to
  // render for a logged-in visitor too, not just bounce them into the app.
  // /login still redirects an already-authenticated visitor onward on its
  // own, so the CTA below works correctly either way.
  const [{ user }, { dict }] = await Promise.all([getCurrentHousehold(), getDictionary()]);
  // No login wall: a visitor goes straight into the app as a guest.
  const appHref = "/recipes";

  const highlightFeatures = [
    { title: dict.landing.feature1Title, description: dict.landing.feature1Desc },
    { title: dict.landing.feature2Title, description: dict.landing.feature2Desc },
    { title: dict.landing.feature3Title, description: dict.landing.feature3Desc },
  ].map((f, i) => ({ ...f, mascot: FEATURE_MASCOTS[i], screenshot: FEATURE_SCREENSHOTS[i] }));

  const painPoints = [dict.landing.pain1, dict.landing.pain2, dict.landing.pain3];

  return (
    <div className="h-dvh w-full overflow-y-auto overscroll-contain">
      <header
        className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
      >
        <div className="flex items-center gap-3">
          {user && <BackButton href="/mypage" />}
          <div className="flex items-center gap-2">
            <Mascot name="logo" size={28} className="rounded-lg" />
            <span className="text-sm font-bold tracking-wide text-ink">우리집 레시피</span>
          </div>
        </div>
        <Link href={appHref} className="text-sm font-bold text-ink-soft">
          {dict.landing.goToApp}
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 pb-20 pt-8 md:grid-cols-2 md:items-center md:pb-32 md:pt-16">
        <div>
          <Mascot name="main" size={144} className="mb-5 -ml-2" />
          <p className="mb-5 text-xs font-bold tracking-wide text-ink-faint">우리집 레시피</p>
          <h1 className="text-[36px] font-bold leading-tight text-ink md:text-[48px]">
            {dict.landing.headline1}
            <br />
            <span className="text-accent">{dict.landing.headline2}</span>
            <br />
            {dict.landing.headline3}
            <br />
            <span className="text-accent">{dict.landing.headline4}</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">{dict.landing.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={appHref}
              className="inline-block rounded-xl bg-accent px-7 py-4 text-sm font-bold text-white"
            >
              {dict.landing.start}
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/recipe-list.png"
            alt=""
            className="aspect-[466/893] w-full object-contain"
          />
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <Mascot name="confused" size={72} className="mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{dict.landing.painHeading}</h2>
          <div className="mt-8 flex flex-col gap-3">
            {painPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-border bg-cream px-5 py-4 text-sm font-semibold text-ink-soft md:text-base"
              >
                {point}
              </div>
            ))}
          </div>
          <p className="mt-8 text-base font-bold text-ink md:text-lg">
            {dict.landing.painFooterPrefix}
            <span className="text-accent">{dict.landing.painFooterBrand}</span>
            {dict.landing.painFooterSuffix}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{dict.landing.featuresHeading}</h2>

          <div className="mt-14 flex flex-col gap-16 md:gap-24">
            {highlightFeatures.map((f, i) => (
              <div
                key={f.title}
                className={`flex flex-col items-center gap-8 md:gap-14 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div className="w-full md:flex-1">
                  <Mascot name={f.mascot} size={84} className="mb-3" />
                  <h3 className="text-lg font-bold text-ink md:text-xl">{f.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft md:text-base">
                    {f.description}
                  </p>
                </div>
                <div className="w-full md:flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.screenshot}
                    alt=""
                    className="mx-auto aspect-[466/893] w-full max-w-[360px] object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <Mascot name="happy" size={88} className="mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{dict.landing.finalCtaHeading}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{dict.landing.finalCtaSubtitle}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={appHref}
              className="inline-block rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white"
            >
              {dict.landing.start}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-ink-faint">
        {dict.landing.footer}
      </footer>
    </div>
  );
}

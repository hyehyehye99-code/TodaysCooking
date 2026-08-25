import Link from "next/link";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui";

const FEATURE_ICONS = [
  <svg key="ai" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M5 4.5C5 3.67 5.67 3 6.5 3H16v15H6.5A1.5 1.5 0 015 16.5v-12z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M5 16.5A1.5 1.5 0 016.5 15H16" stroke="currentColor" strokeWidth="1.75" />
    <path d="M8.5 7h4.5M8.5 10h4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>,
  <svg key="shopping" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path
      d="M4.5 6.5h13l-1.2 9.4a1.5 1.5 0 01-1.49 1.3H7.19a1.5 1.5 0 01-1.49-1.3L4.5 6.5z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M7.5 6.5a3.5 3.5 0 017 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>,
  <svg key="family" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 19c0-3 2.5-5.5 5-5.5S13 16 13 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    <path d="M14.5 13.5c2.5 0 4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>,
];

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
  const [{ user, household }, { dict }] = await Promise.all([getCurrentHousehold(), getDictionary()]);
  const appHref = !user ? "/login" : household ? "/recipes" : "/onboarding";
  const webCtaLabel = user ? dict.landing.goToApp : dict.landing.ctaWeb;

  const highlightFeatures = [
    { title: dict.landing.feature1Title, description: dict.landing.feature1Desc },
    { title: dict.landing.feature2Title, description: dict.landing.feature2Desc },
    { title: dict.landing.feature3Title, description: dict.landing.feature3Desc },
  ].map((f, i) => ({ ...f, icon: FEATURE_ICONS[i], screenshot: FEATURE_SCREENSHOTS[i] }));

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={28} height={28} />
            <span className="text-sm font-bold tracking-wide text-ink">우리집 레시피</span>
          </div>
        </div>
        <Link href={appHref} className="text-sm font-bold text-ink-soft">
          {user ? dict.landing.goToApp : dict.landing.login}
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 pb-20 pt-8 md:grid-cols-2 md:items-center md:pb-32 md:pt-16">
        <div>
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
              {webCtaLabel}
            </Link>
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-7 py-4 text-sm font-bold text-ink-faint"
            >
              {dict.landing.ctaIos}
            </span>
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
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                    {f.icon}
                  </div>
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

      <section className="border-t border-border py-20">
        <div className="mx-auto w-full max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-ink md:text-3xl">{dict.landing.pricingHeading}</h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-ink-soft">
            {dict.landing.pricingSubtitle}
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-7">
              <p className="text-sm font-bold text-ink-faint">{dict.landing.freePlan}</p>
              <p className="mt-2 text-3xl font-bold text-ink">₩0</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                <li>· {dict.landing.freeFeature1}</li>
                <li>· {dict.landing.freeFeature2}</li>
                <li>· {dict.landing.freeFeature3}</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-accent p-7">
              <p className="text-sm font-bold text-accent">{dict.landing.premiumPlan}</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                ₩3,300<span className="text-sm font-semibold text-ink-faint">{dict.landing.premiumPerMonth}</span>
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                <li>· {dict.landing.premiumFeature1}</li>
                <li>· {dict.landing.premiumFeature2}</li>
                <li>· {dict.landing.premiumFeature3}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{dict.landing.finalCtaHeading}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{dict.landing.finalCtaSubtitle}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={appHref}
              className="inline-block rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white"
            >
              {webCtaLabel}
            </Link>
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border px-8 py-4 text-sm font-bold text-ink-faint"
            >
              {dict.landing.ctaIos}
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-ink-faint">
        {dict.landing.footer}
      </footer>
    </div>
  );
}

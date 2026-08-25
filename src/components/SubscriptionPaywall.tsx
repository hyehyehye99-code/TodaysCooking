"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage, type PurchasesError } from "@revenuecat/purchases-capacitor";
import { GlassCard } from "@/components/ui";
import { useDict } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

const REVENUECAT_IOS_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";

function subscribeNever() {
  return () => {};
}

// App Store guideline 3.1.2 requires the subscription screen to show each
// plan's length alongside its title/price — RevenueCat exposes it as an
// ISO 8601 duration ("P1M", "P1Y", ...) rather than display text.
function formatSubscriptionPeriod(period: string | null, dict: Dictionary): string | null {
  const match = period?.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/);
  if (!match) return null;
  const [, years, months, weeks, days] = match;
  if (years) return dict.components.periodYearTemplate.replace("{n}", years);
  if (months) return dict.components.periodMonthTemplate.replace("{n}", months);
  if (weeks) return dict.components.periodWeekTemplate.replace("{n}", weeks);
  if (days) return dict.components.periodDayTemplate.replace("{n}", days);
  return null;
}

// Same hydration-safe read as PushNotificationToggle — window.Capacitor
// doesn't exist during SSR, so this can't be read directly in render.
function getIsNativeSnapshot() {
  return Capacitor.isNativePlatform();
}
function getIsNativeServerSnapshot() {
  return false;
}

// The purchase button is only offered where App Store pricing is actually
// set up (Korea) — everywhere else the storefront would show a converted
// price nobody has reviewed. Read from the device's language/region setting
// rather than the App Store storefront itself, since that reads before
// RevenueCat/StoreKit is configured and needs no extra native call.
function getRegionSnapshot() {
  try {
    return new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale).region ?? null;
  } catch {
    return null;
  }
}
function getRegionServerSnapshot() {
  return null;
}

type Status = "idle" | "loading" | "purchasing" | "restoring";

export function SubscriptionPaywall({
  isPremium,
  householdId,
}: {
  isPremium: boolean;
  householdId: string | null;
}) {
  const dict = useDict();
  const isNative = useSyncExternalStore(subscribeNever, getIsNativeSnapshot, getIsNativeServerSnapshot);
  const region = useSyncExternalStore(subscribeNever, getRegionSnapshot, getRegionServerSnapshot);
  const isKorea = region === "KR";
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative || !householdId || isPremium || !isKorea) return;
    (async () => {
      setStatus("loading");
      try {
        // The household id doubles as the RevenueCat app user id — one
        // purchase made under this id unlocks the entitlement for every
        // member, since the AI-limit check in ai-recipe.ts looks up
        // household_subscriptions by this same household_id.
        await Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY, appUserID: householdId });
        const offerings = await Purchases.getOfferings();
        setPackages(offerings.current?.availablePackages ?? []);
      } catch (e) {
        // Surfaced only via Safari Web Inspector (Mac: Safari > Develop >
        // [device] > this page) — RevenueCat shows zero successful SDK
        // connections ever, so this log is the fastest way to see what
        // configure()/getOfferings() actually threw on-device.
        console.error("[SubscriptionPaywall] offerings fetch failed:", e);
        setError(dict.components.subFetchError);
      } finally {
        setStatus("idle");
      }
    })();
  }, [isNative, householdId, isPremium, isKorea, dict.components.subFetchError]);

  async function purchase(pkg: PurchasesPackage) {
    setStatus("purchasing");
    setError(null);
    try {
      await Purchases.purchasePackage({ aPackage: pkg });
      // The webhook writes household_subscriptions asynchronously — refresh
      // so the server component re-checks it a moment later. If it hasn't
      // landed yet, opening this page again shortly after will show it.
      router.refresh();
    } catch (e) {
      // RevenueCat throws for a cancelled purchase too — that's silent and
      // expected. Anything else (no sandbox account signed in, the product
      // not yet approved, network failure, ...) used to fail exactly the
      // same way, with nothing on screen to tell the two apart.
      if (!(e as PurchasesError)?.userCancelled) {
        console.error("[SubscriptionPaywall] purchase failed:", e);
        setError(dict.components.purchaseError);
      }
    } finally {
      setStatus("idle");
    }
  }

  async function restore() {
    setStatus("restoring");
    setError(null);
    try {
      await Purchases.restorePurchases();
      router.refresh();
    } catch (e) {
      console.error("[SubscriptionPaywall] restore failed:", e);
      setError(dict.components.restoreError);
    } finally {
      setStatus("idle");
    }
  }

  if (!isNative) {
    return (
      <GlassCard className="bg-white p-4">
        <p className="text-sm text-ink-soft">{dict.components.iosOnly}</p>
      </GlassCard>
    );
  }

  if (isPremium) {
    return (
      <GlassCard className="bg-white p-4">
        <a
          href="https://apps.apple.com/account/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-accent-ink"
        >
          {dict.components.manageOnApple}
        </a>
      </GlassCard>
    );
  }

  if (!isKorea) {
    return (
      <GlassCard className="bg-white p-4">
        <p className="text-sm text-ink-soft">{dict.components.koreaOnly}</p>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Static price/plan info — doesn't depend on Purchases.getOfferings(),
          so it's still visible (App Store guideline 3.1.2: price + duration
          shown up front) even when the live RevenueCat fetch fails, e.g. a
          subscription still pending its own App Store Connect review. */}
      <GlassCard className="bg-white p-4">
        <p className="text-sm font-bold text-accent">{dict.landing.premiumPlan}</p>
        <p className="mt-1 text-2xl font-bold text-ink">
          ₩3,300<span className="text-xs font-semibold text-ink-faint">{dict.landing.premiumPerMonth}</span>
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-xs text-ink-soft">
          <li>· {dict.landing.premiumFeature1}</li>
          <li>· {dict.landing.premiumFeature2}</li>
          <li>· {dict.landing.premiumFeature3}</li>
        </ul>
      </GlassCard>

      {packages.map((pkg) => {
        const period = formatSubscriptionPeriod(pkg.product.subscriptionPeriod, dict);
        return (
          <button
            key={pkg.identifier}
            type="button"
            onClick={() => purchase(pkg)}
            disabled={status !== "idle"}
            className="flex items-center justify-between rounded-2xl bg-accent px-4 py-4 text-left text-white disabled:opacity-60"
          >
            <span className="text-sm font-bold">
              {pkg.product.title}
              {period && <span className="ml-1.5 font-normal opacity-80">· {period}</span>}
            </span>
            <span className="text-sm font-bold">{pkg.product.priceString}</span>
          </button>
        );
      })}
      {status === "loading" && <p className="text-xs text-ink-faint">{dict.common.loading}</p>}
      {error && <p className="text-xs text-warn-ink">{error}</p>}
      <button
        type="button"
        onClick={restore}
        disabled={status !== "idle"}
        className="text-xs text-ink-faint underline disabled:opacity-60"
      >
        {status === "restoring" ? dict.components.restoring : dict.components.restorePurchases}
      </button>
      <p className="text-center text-[11px] text-ink-faint">
        {dict.components.subscriptionDisclaimer}
        <br />
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
          {dict.mypage.terms}
        </a>
        {" · "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          {dict.mypage.privacy}
        </a>
      </p>
    </div>
  );
}

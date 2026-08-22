"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { getCoupangSearchLink } from "@/lib/actions/coupang";

export function CoupangRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") ?? "";

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    let redirected = false;
    getCoupangSearchLink(name).then(({ url }) => {
      if (cancelled) return;
      redirected = true;
      // The native app opens the result in Capacitor's in-app browser and
      // returns to /shopping itself, instead of navigating the WKWebView's
      // own history to an external domain — allowNavigation would just
      // kick that out to the system browser instead.
      if (Capacitor.isNativePlatform()) {
        Browser.open({ url });
        router.replace("/shopping");
        return;
      }
      window.location.replace(url);
    });

    // In a standalone PWA, the app has no real "tab" of its own — the
    // location.replace() above either hands off to the system browser
    // (leaving this page as the app's last-rendered state) or, in some
    // browser/OS combinations, silently does nothing at all. Either way, if
    // the user comes back to this page and it's still just sitting here, it
    // never actually got anywhere — send them back to the shopping list
    // instead of leaving them stuck on "이동중이에요~" forever.
    function handleVisible() {
      if (document.visibilityState === "visible" && redirected) {
        window.location.replace("/shopping");
      }
    }
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [name, router]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col items-center justify-center px-7 text-center">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={72} height={72} />
        <p className="text-sm font-bold text-ink">쿠팡으로 이동중이에요~</p>
        <p className="rounded-xl bg-surface px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
          쿠팡파트너스 활동의 일환으로 &quot;구매하기&quot; 버튼을 클릭하면 이에 따른 일정 금액의
          수수료를 제공받습니다.
        </p>
        <div className="mt-2 h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    </div>
  );
}

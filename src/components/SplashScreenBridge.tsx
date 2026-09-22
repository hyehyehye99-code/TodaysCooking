"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

// capacitor.config.ts's launchAutoHide (native-side, on by default) is what
// guarantees the splash always comes down eventually — after
// launchShowDuration — with zero dependency on this component, or any of
// our JS, ever running at all. That's the fix for the bug a previous
// version hit: it relied on this same "hide on mount" as the ONLY way the
// splash ever came down (via launchAutoHide: false), so a slow/failed
// remote load that never got this far left the splash stuck up forever.
//
// What this component adds on top is hiding EARLY — the moment a real
// screen has actually mounted, instead of always waiting out the full
// native timer. .hide() is a no-op if the native side already auto-hid it,
// so calling it here is always safe.
export function SplashScreenBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide().catch(() => {});
  }, []);

  return null;
}

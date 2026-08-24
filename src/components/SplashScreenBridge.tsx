"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

// capacitor.config.ts sets launchAutoHide: false, so the native splash image
// stays up until this fires — mounting here means it only comes down once
// the WKWebView has actually fetched the remote page and hydrated a real
// screen, instead of auto-hiding on a timer that can elapse before that.
export function SplashScreenBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide().catch(() => {});
  }, []);

  return null;
}

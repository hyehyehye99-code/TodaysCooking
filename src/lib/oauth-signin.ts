"use client";

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { createClient } from "@/lib/supabase/client";

// Registered as a custom URL scheme in Info.plist so iOS hands the OAuth
// redirect back to this app instead of loading it as a page — see
// NativeAuthBridge for why that's required (cookie jar isolation between
// the system browser and the app's own WKWebView).
const NATIVE_REDIRECT_URL = "com.hyeji.ourmenu://auth/callback";

export async function signInWithProvider(provider: "google" | "apple" | "kakao") {
  const supabase = createClient();

  if (Capacitor.isNativePlatform()) {
    const { data } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: NATIVE_REDIRECT_URL, skipBrowserRedirect: true },
    });
    if (data?.url) await Browser.open({ url: data.url });
    return;
  }

  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

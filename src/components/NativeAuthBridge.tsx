"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { createClient } from "@/lib/supabase/client";

// OAuth in the wrapped native app can't finish through /auth/callback like
// the web flow does: that route exchanges the code for a session on the
// SERVER, setting the session cookie in whichever cookie jar made the
// request — and the system browser Capacitor opens for the provider's
// consent screen has its own jar, separate from the app's WKWebView. The
// custom URL scheme (registered in Info.plist) is what lets the OS hand the
// redirect back to the app itself instead of loading it as a page, so the
// code exchange below runs inside the WKWebView and lands the session
// cookie where the app can actually read it.
export function NativeAuthBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const supabase = createClient();
    const listener = App.addListener("appUrlOpen", async ({ url }) => {
      if (!url.includes("auth/callback")) return;
      await Browser.close().catch(() => {});
      const code = new URL(url).searchParams.get("code");
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) router.replace("/recipes");
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}

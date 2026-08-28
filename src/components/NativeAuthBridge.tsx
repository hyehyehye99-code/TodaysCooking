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
    // iOS can redeliver the same appUrlOpen event (e.g. the app briefly
    // backgrounding during the system browser handoff) — an OAuth code is
    // single-use, so a naive re-run would just fail exchangeCodeForSession
    // harmlessly, but tracking the last code short-circuits that redundant
    // network round trip instead of silently swallowing an error each time.
    let lastCode: string | null = null;
    const listener = App.addListener("appUrlOpen", async ({ url }) => {
      // The iOS Share Extension (ios/App/ShareExtension) hands off a shared
      // link this way: it puts the URL on the general pasteboard and opens
      // com.hyeji.ourmenu://share-recipe to bring the app to the front. The
      // new-recipe screen already offers to use whatever link is on the
      // clipboard (see useClipboardLinkSuggestion.ts), so there's nothing
      // else to read off this URL itself.
      if (url.includes("share-recipe")) {
        router.replace("/recipes/new");
        return;
      }

      if (!url.includes("auth/callback")) return;
      await Browser.close().catch(() => {});
      const code = new URL(url).searchParams.get("code");
      if (!code || code === lastCode) return;
      lastCode = code;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) router.replace("/recipes");
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}

"use client";

import { useState } from "react";
import { signInWithProvider } from "@/lib/oauth-signin";
import { useDict } from "@/lib/i18n/client";

const PENDING_INVITE_COOKIE = "pending_invite_code";

// Someone tapping an invite link may not be signed in with Google at all —
// this used to offer only a Google button, so anyone whose usual account was
// Kakao or Apple had no way to actually join. Mirrors the three buttons on
// /login (see google-signin-button.tsx etc.), just with the invite code
// stashed in a cookie first: read back once the provider redirects here, so
// the invite can be applied right after the session is created — by
// /auth/callback/route.ts on the web, or by NativeAuthBridge's appUrlOpen
// handler in the native app (this /join page can open inside the app too,
// via the apple-app-site-association Universal Link, so both have to work).
function useJoinSignIn(code: string) {
  const [pendingProvider, setPendingProvider] = useState<"google" | "apple" | "kakao" | null>(null);

  async function signIn(provider: "google" | "apple" | "kakao") {
    setPendingProvider(provider);
    document.cookie = `${PENDING_INVITE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=600`;
    // signInWithProvider already branches on Capacitor.isNativePlatform():
    // native opens the provider's consent screen in the system browser
    // (required — Google/Kakao/Apple all block OAuth inside an embedded
    // WKWebView) and comes back via the custom URL scheme instead of this
    // page's own redirect.
    await signInWithProvider(provider);
  }

  return { pendingProvider, signIn };
}

export function JoinOAuthButtons({ code }: { code: string }) {
  const dict = useDict();
  const { pendingProvider, signIn } = useJoinSignIn(code);
  const pending = pendingProvider !== null;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-4 text-sm font-bold text-ink disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        {pendingProvider === "google" ? dict.login.redirecting : dict.login.google}
      </button>

      <button
        type="button"
        onClick={() => signIn("apple")}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-sm font-bold text-white disabled:opacity-60"
      >
        <svg width="16" height="18" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
          <path d="M14.14 10.56c-.02-2.1 1.72-3.1 1.8-3.15-.98-1.43-2.5-1.63-3.04-1.65-1.3-.13-2.53.76-3.19.76-.66 0-1.68-.74-2.76-.72-1.42.02-2.73.82-3.46 2.09-1.48 2.56-.38 6.35 1.06 8.43.7 1.01 1.54 2.15 2.64 2.11 1.06-.04 1.46-.68 2.74-.68 1.27 0 1.64.68 2.76.66 1.14-.02 1.86-1.03 2.55-2.05.81-1.17 1.14-2.31 1.16-2.37-.03-.01-2.23-.85-2.26-3.43z" />
          <path d="M12.15 4.13c.58-.7.97-1.68.86-2.65-.83.03-1.85.55-2.45 1.24-.53.61-1 1.6-.88 2.55.93.07 1.88-.47 2.47-1.14z" />
        </svg>
        {pendingProvider === "apple" ? dict.login.redirecting : dict.login.apple}
      </button>

      <button
        type="button"
        onClick={() => signIn("kakao")}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-4 text-sm font-bold text-[#191919] disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <path d="M9 1.5C4.31 1.5.5 4.53.5 8.27c0 2.4 1.58 4.51 3.96 5.72-.17.63-.63 2.32-.72 2.68-.11.44.16.44.34.32.14-.1 2.24-1.52 3.15-2.14.57.08 1.16.13 1.77.13 4.69 0 8.5-3.03 8.5-6.77S13.69 1.5 9 1.5z" />
        </svg>
        {pendingProvider === "kakao" ? dict.login.redirecting : dict.login.kakao}
      </button>
    </div>
  );
}

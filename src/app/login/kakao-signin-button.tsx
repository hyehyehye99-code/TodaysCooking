"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Needs the "Kakao" provider configured in Supabase Auth (REST API key as
// Client ID, Client Secret, and the redirect URI registered in the Kakao
// Developers console) before this actually works. Supabase's GoTrue always
// requests account_email for this provider regardless of the `scopes`
// option passed here (it appends rather than overrides) — that scope 401s
// with KOE205 until the Kakao app has gone through the "individual
// developer business app" conversion, so that has to happen on Kakao's
// side, not here.
export function KakaoSignInButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-4 text-sm font-bold text-[#191919] disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path d="M9 1.5C4.31 1.5.5 4.53.5 8.27c0 2.4 1.58 4.51 3.96 5.72-.17.63-.63 2.32-.72 2.68-.11.44.16.44.34.32.14-.1 2.24-1.52 3.15-2.14.57.08 1.16.13 1.77.13 4.69 0 8.5-3.03 8.5-6.77S13.69 1.5 9 1.5z" />
      </svg>
      {pending ? "이동하는 중..." : "카카오톡으로 시작하기"}
    </button>
  );
}

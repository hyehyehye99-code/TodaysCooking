"use client";

import { useState } from "react";
import { signInWithProvider } from "@/lib/oauth-signin";

// Needs the "Kakao" provider configured in Supabase Auth (REST API key as
// Client ID, matching Client Secret Code, and the redirect URI registered
// under [플랫폼 키] > [REST API 키] in the Kakao Developers console — not
// under the 카카오 로그인 menu). Supabase's GoTrue always requests
// account_email/profile_nickname/profile_image for this provider regardless
// of the `scopes` option passed here (it appends rather than overrides), so
// all three consent items must stay enabled on Kakao's side even though this
// app doesn't read the nickname/avatar.
export function KakaoSignInButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await signInWithProvider("kakao");
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

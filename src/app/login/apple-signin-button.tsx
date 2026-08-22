"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Needs the "Apple" provider configured in Supabase Auth (Services ID,
// Team ID, Key ID, and the .p8 private key from an Apple Developer account)
// before this actually works — the button/flow itself is ready either way.
export function AppleSignInButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-sm font-bold text-white disabled:opacity-60"
    >
      <svg width="16" height="18" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
        <path d="M14.14 10.56c-.02-2.1 1.72-3.1 1.8-3.15-.98-1.43-2.5-1.63-3.04-1.65-1.3-.13-2.53.76-3.19.76-.66 0-1.68-.74-2.76-.72-1.42.02-2.73.82-3.46 2.09-1.48 2.56-.38 6.35 1.06 8.43.7 1.01 1.54 2.15 2.64 2.11 1.06-.04 1.46-.68 2.74-.68 1.27 0 1.64.68 2.76.66 1.14-.02 1.86-1.03 2.55-2.05.81-1.17 1.14-2.31 1.16-2.37-.03-.01-2.23-.85-2.26-3.43z" />
        <path d="M12.15 4.13c.58-.7.97-1.68.86-2.65-.83.03-1.85.55-2.45 1.24-.53.61-1 1.6-.88 2.55.93.07 1.88-.47 2.47-1.14z" />
      </svg>
      {pending ? "이동하는 중..." : "Apple로 시작하기"}
    </button>
  );
}

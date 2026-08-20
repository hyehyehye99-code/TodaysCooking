"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { reactToRecipe, unreactToRecipe } from "@/lib/actions/sharing";

const POST_LOGIN_REDIRECT_COOKIE = "post_login_redirect";

export function ReactButton({
  recipeId,
  shareCode,
  isLoggedIn,
  initiallyReacted,
}: {
  recipeId: string;
  shareCode: string;
  isLoggedIn: boolean;
  initiallyReacted: boolean;
}) {
  const [reacted, setReacted] = useState(initiallyReacted);
  const [pending, startTransition] = useTransition();

  async function loginThenReact() {
    // Read back by /auth/callback once Google redirects here, so the
    // visitor lands back on this share page instead of inside the app.
    document.cookie = `${POST_LOGIN_REDIRECT_COOKIE}=/share/${shareCode}; path=/; max-age=600`;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  function toggle() {
    if (!isLoggedIn) {
      loginThenReact();
      return;
    }
    const next = !reacted;
    setReacted(next);
    startTransition(async () => {
      if (next) await reactToRecipe(recipeId);
      else await unreactToRecipe(recipeId);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={reacted ? "먹고싶어요 취소하기" : "이거 먹고싶어요"}
      className="flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill={reacted ? "var(--color-warn)" : "none"}
        stroke={reacted ? "var(--color-warn)" : "var(--color-ink-faint)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

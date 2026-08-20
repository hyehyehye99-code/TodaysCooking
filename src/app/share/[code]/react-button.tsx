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
      className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold disabled:opacity-60 ${
        reacted ? "bg-positive/14 text-positive-ink" : "bg-accent text-white"
      }`}
    >
      {reacted ? "표현했어요 ✓" : "이거 먹고싶어요"}
    </button>
  );
}

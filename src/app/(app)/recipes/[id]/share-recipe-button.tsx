"use client";

import { useState, useTransition } from "react";
import { useDict } from "@/lib/i18n/client";
import { ensureRecipeShareCode } from "@/lib/actions/sharing";

export function ShareRecipeButton({ recipeId, title }: { recipeId: string; title: string }) {
  const dict = useDict();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function share() {
    startTransition(async () => {
      const result = await ensureRecipeShareCode(recipeId);
      if (!result.ok) return;

      const url = `${window.location.origin}/share/recipe/${result.shareCode}`;

      // navigator.share opens the native share sheet inside the WKWebView
      // shell (Messages/KakaoTalk/etc.); anyone who opens the link sees a
      // read-only copy of this recipe screen, no login required. Falls back
      // to a clipboard copy on platforms/browsers without it.
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {
          // Includes the user dismissing the share sheet — nothing to show.
        }
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={pending}
      aria-label={dict.recipes.share}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink disabled:opacity-60"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-positive-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12l5 5L20 6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" />
        </svg>
      )}
    </button>
  );
}

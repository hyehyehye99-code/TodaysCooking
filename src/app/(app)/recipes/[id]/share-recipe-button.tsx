"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/client";

export function ShareRecipeButton({
  title,
  ingredients,
  instructions,
}: {
  title: string;
  ingredients: string[];
  instructions: string | null;
}) {
  const dict = useDict();
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = [
      title,
      "",
      dict.recipes.shareIngredientsHeading,
      ...ingredients,
      ...(instructions ? ["", dict.recipes.shareInstructionsHeading, instructions] : []),
    ].join("\n");

    // navigator.share opens the native share sheet inside the WKWebView
    // shell (Messages/KakaoTalk/etc.) — there's no public URL for a single
    // recipe, so this shares the recipe itself as plain text rather than a
    // link. Falls back to a clipboard copy on platforms/browsers without it.
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // Includes the user dismissing the share sheet — nothing to show.
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={dict.recipes.share}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
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

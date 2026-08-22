"use client";

import { useEffect, useState } from "react";
import { Clipboard } from "@capacitor/clipboard";

const URL_PATTERN = /^https?:\/\/\S+$/i;

// Checks the clipboard once per `enabled` transition to true (e.g. a form
// or sheet becoming visible), only when the field this is attached to was
// empty at that point — never re-checks on every keystroke, and never shows
// a suggestion for content the user is already partway through typing. A
// failed/denied read (common on web, where reading the clipboard needs an
// explicit user gesture) just means no suggestion, not an error.
export function useClipboardLinkSuggestion(initialValue: string, enabled = true) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || initialValue.trim() !== "") return;
    let cancelled = false;
    Clipboard.read()
      .then(({ value }) => {
        if (cancelled) return;
        const trimmed = value?.trim() ?? "";
        if (URL_PATTERN.test(trimmed)) setSuggestion(trimmed);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // initialValue is intentionally excluded — re-checking every time it
    // changes (which happens as the user types) would re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    suggestion: suggestion && suggestion !== dismissed ? suggestion : null,
    dismiss: () => setDismissed(suggestion),
  };
}

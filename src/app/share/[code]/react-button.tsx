"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { reactToRecipe, unreactToRecipe } from "@/lib/actions/sharing";

const REACTED_STORAGE_KEY = "reacted_recipe_ids";

function getReactedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(REACTED_STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function rememberReacted(recipeId: string) {
  const set = getReactedSet();
  set.add(recipeId);
  localStorage.setItem(REACTED_STORAGE_KEY, JSON.stringify([...set]));
}

function noopSubscribe() {
  return () => {};
}

export function ReactButton({
  recipeId,
  isLoggedIn,
  initiallyReacted,
}: {
  recipeId: string;
  isLoggedIn: boolean;
  initiallyReacted: boolean;
}) {
  // Anonymous visitors have no server-checkable identity, so "already
  // reacted" for them lives in this browser's localStorage. Read via
  // useSyncExternalStore rather than an effect + setState: its server
  // snapshot is always false (the server can't see localStorage), so the
  // first client render can safely differ from there afterward without
  // that being a hydration mismatch.
  const reactedLocally = useSyncExternalStore(
    noopSubscribe,
    () => getReactedSet().has(recipeId),
    () => false
  );

  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  const reacted = optimistic ?? (isLoggedIn ? initiallyReacted : reactedLocally);

  function toggle() {
    if (pending) return;

    if (!isLoggedIn) {
      // One-way for anonymous visitors: there's no identity to undo a
      // reaction by, so once reacted (per this browser) it stays reacted.
      if (reacted) return;
      setOptimistic(true);
      rememberReacted(recipeId);
      startTransition(async () => {
        await reactToRecipe(recipeId);
      });
      return;
    }

    const next = !reacted;
    setOptimistic(next);
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

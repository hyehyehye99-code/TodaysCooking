"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearRecipeReactions } from "@/lib/actions/sharing";

type Reaction = { id: string; nickname: string; created_at: string };

export function ReactionLog({ recipeId, reactions }: { recipeId: string; reactions: Reaction[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (reactions.length === 0) return null;

  function handleClear() {
    startTransition(async () => {
      await clearRecipeReactions(recipeId);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex items-center justify-between gap-2 border-t border-border pt-4">
      <p className="text-xs text-ink-soft">{reactions.length}명이 먹고 싶다고 표현했어요~!</p>
      <button
        type="button"
        onClick={handleClear}
        disabled={pending}
        className="shrink-0 text-[11px] text-ink-faint disabled:opacity-60"
      >
        초기화
      </button>
    </div>
  );
}

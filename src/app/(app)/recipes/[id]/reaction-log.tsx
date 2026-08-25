"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearRecipeReactions } from "@/lib/actions/sharing";
import { useDict } from "@/lib/i18n/client";

type Reaction = { id: string; nickname: string; created_at: string };

export function ReactionLog({ recipeId, reactions }: { recipeId: string; reactions: Reaction[] }) {
  const dict = useDict();
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
      <p className="text-xs text-ink-soft">
        {dict.recipes.reactionCountTemplate.replace("{count}", String(reactions.length))}
      </p>
      <button
        type="button"
        onClick={handleClear}
        disabled={pending}
        className="shrink-0 text-[11px] text-ink-faint disabled:opacity-60"
      >
        {dict.recipes.resetReactions}
      </button>
    </div>
  );
}

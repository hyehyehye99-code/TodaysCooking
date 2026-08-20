"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipeReaction } from "@/lib/actions/sharing";

type Reaction = { id: string; nickname: string; created_at: string };

export function ReactionLog({ recipeId, reactions }: { recipeId: string; reactions: Reaction[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (reactions.length === 0) return null;

  function handleDelete(reactionId: string) {
    startTransition(async () => {
      await deleteRecipeReaction(reactionId, recipeId);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 border-t border-border pt-4">
      <p className="mb-2 text-xs font-bold text-ink-soft">먹고 싶다는 반응</p>
      <div className="flex flex-col gap-1.5">
        {reactions.map((reaction) => (
          <div key={reaction.id} className="flex items-center justify-between gap-2">
            <p className="text-xs text-ink-soft">{reaction.nickname}님이 먹고 싶다고 표현했어요~!</p>
            <button
              type="button"
              onClick={() => handleDelete(reaction.id)}
              disabled={pending}
              aria-label="삭제"
              className="shrink-0 text-[11px] text-ink-faint disabled:opacity-60"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

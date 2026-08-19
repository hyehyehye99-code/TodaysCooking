"use client";

import { useState } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
      >
        레시피 삭제
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-surface py-3">
      <span className="text-xs text-ink-soft">정말 삭제할까요?</span>
      <button onClick={() => setConfirming(false)} className="text-xs font-bold text-ink-soft underline">
        취소
      </button>
      <form action={deleteRecipe}>
        <input type="hidden" name="id" value={recipeId} />
        <button type="submit" className="text-xs font-bold text-warn-ink underline">
          삭제
        </button>
      </form>
    </div>
  );
}

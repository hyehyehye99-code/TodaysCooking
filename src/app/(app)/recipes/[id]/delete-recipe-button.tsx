"use client";

import { useState } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-xs text-ink-faint underline">
        레시피 삭제
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink-soft">정말 삭제할까요?</span>
      <button onClick={() => setConfirming(false)} className="text-xs text-ink-soft underline">
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

"use client";

import { deleteCookLog } from "@/lib/actions/recipes";

export function DeleteCookLogButton({ id, recipeId }: { id: string; recipeId: string }) {
  return (
    <form action={deleteCookLog}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="recipeId" value={recipeId} />
      <button type="submit" className="text-[11px] text-ink-faint">
        삭제
      </button>
    </form>
  );
}

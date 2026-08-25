"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDict } from "@/lib/i18n/client";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const dict = useDict();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    startTransition(async () => {
      const form = new FormData();
      form.set("id", recipeId);
      await deleteRecipe(form);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
      >
        {dict.recipes.deleteMenu}
      </button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={dict.recipes.deleteRecipeTitle}
        description={dict.recipes.deleteRecipeDescription}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />
    </>
  );
}

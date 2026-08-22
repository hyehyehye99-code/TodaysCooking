"use client";

import { useState, useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";
import { ConfirmModal } from "@/components/ConfirmModal";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
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
        메뉴 삭제
      </button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="메뉴를 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 재료와 메모도 함께 사라져요."
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제 중..." : "삭제"}
          </button>
        }
      />
    </>
  );
}

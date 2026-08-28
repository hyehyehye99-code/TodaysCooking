"use client";

import { useState, useTransition } from "react";
import { deleteCreatorRecipe } from "@/lib/actions/admin";
import { ConfirmModal } from "@/components/ConfirmModal";

export function DeleteRecipeButton({ creatorId, recipeId }: { creatorId: string; recipeId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteCreatorRecipe(creatorId, recipeId);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="삭제"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink-faint"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="이 레시피를 삭제할까요?"
        confirmSlot={
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제하는 중..." : "삭제"}
          </button>
        }
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { deleteCreator } from "@/lib/actions/admin";
import { ConfirmModal } from "@/components/ConfirmModal";

export function DeleteCreatorButton({ creatorId, recipeCount }: { creatorId: string; recipeCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteCreator(creatorId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-warn/40 bg-white px-3.5 py-2 text-xs font-bold text-warn-ink"
      >
        크리에이터 삭제
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="이 크리에이터를 삭제할까요?"
        description={recipeCount > 0 ? `등록된 레시피 ${recipeCount}개도 함께 삭제돼요.` : undefined}
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

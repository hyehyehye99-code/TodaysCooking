"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearAllShoppingItems } from "@/lib/actions/shopping";
import { Modal } from "@/components/Modal";

export function ClearShoppingListButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function doClear() {
    startTransition(async () => {
      await clearAllShoppingItems();
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-4 py-2 text-xs font-bold text-warn-ink"
      >
        전체 삭제
      </button>

      <Modal open={confirming} onClose={() => setConfirming(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">장보기 목록을 전체 삭제할까요?</p>
          <p className="mt-2 text-xs text-ink-soft">
            체크 여부와 상관없이 목록의 모든 항목이 삭제돼요. 되돌릴 수 없어요.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={doClear}
              disabled={pending}
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? "삭제 중..." : "전체 삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

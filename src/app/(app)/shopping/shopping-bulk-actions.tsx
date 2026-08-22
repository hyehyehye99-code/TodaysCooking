"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearAllShoppingItems, clearCheckedItems, setAllShoppingItemsChecked } from "@/lib/actions/shopping";
import { Modal } from "@/components/Modal";

export function ShoppingBulkActions({
  doneCount,
  allChecked,
}: {
  doneCount: number;
  allChecked: boolean;
}) {
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [confirmingChecked, setConfirmingChecked] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function doDeleteAll() {
    startTransition(async () => {
      await clearAllShoppingItems();
      setConfirmingAll(false);
      router.refresh();
    });
  }

  function doDeleteChecked() {
    startTransition(async () => {
      await clearCheckedItems();
      setConfirmingChecked(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-8 mb-6 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setConfirmingAll(true)}
            className="px-4 py-2 text-xs font-bold text-ink-soft"
          >
            전체 삭제
          </button>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={() => setConfirmingChecked(true)}
              className="px-4 py-2 text-xs font-bold text-ink-soft"
            >
              선택 삭제
            </button>
          )}
        </div>
        <form action={setAllShoppingItemsChecked}>
          <input type="hidden" name="checked" value={(!allChecked).toString()} />
          <button type="submit" className="px-4 py-2 text-xs font-bold text-ink-soft">
            {allChecked ? "전체 해제" : "전체 선택"}
          </button>
        </form>
      </div>

      <Modal open={confirmingAll} onClose={() => setConfirmingAll(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">장보기 목록을 전체 삭제할까요?</p>
          <p className="mt-2 text-xs text-ink-soft">
            체크 여부와 상관없이 목록의 모든 항목이 삭제돼요. 되돌릴 수 없어요.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingAll(false)}
              className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={doDeleteAll}
              disabled={pending}
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? "삭제 중..." : "전체 삭제"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmingChecked} onClose={() => setConfirmingChecked(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">체크한 {doneCount}개 항목을 삭제할까요?</p>
          <p className="mt-2 text-xs text-ink-soft">되돌릴 수 없어요.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingChecked(false)}
              className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={doDeleteChecked}
              disabled={pending}
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

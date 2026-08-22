"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAllShoppingItemsChecked, deleteShoppingItems } from "@/lib/actions/shopping";
import { Modal } from "@/components/Modal";
import { ShoppingItemRow } from "./shopping-item-row";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingItemsSection({ items }: { items: ShoppingItem[] }) {
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const doneCount = items.filter((i) => i.checked).length;
  const allChecked = items.length > 0 && doneCount === items.length;

  function startDeleting() {
    setSelectedIds(new Set());
    setDeleting(true);
  }

  function cancelDeleting() {
    setDeleting(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      await deleteShoppingItems([...selectedIds]);
      setConfirming(false);
      setDeleting(false);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {deleting ? (
        <div className="mt-6 mb-4 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-bold text-ink-soft">
            {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : "삭제할 항목을 선택하세요"}
          </span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={cancelDeleting}
              className="rounded-lg px-4 py-2 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedIds.size === 0}
              className="rounded-lg bg-warn px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={startDeleting}
            className="px-4 py-2 text-xs font-bold text-ink-soft"
          >
            삭제
          </button>
          <form action={setAllShoppingItemsChecked}>
            <input type="hidden" name="checked" value={(!allChecked).toString()} />
            <button type="submit" className="px-4 py-2 text-xs font-bold text-ink-soft">
              {allChecked ? "전체 해제" : "전체 선택"}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col">
        {deleting
          ? items.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelected(item.id)}
                  className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left"
                >
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] ${
                      checked ? "border-warn bg-warn" : "border-border bg-surface"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 7.5l3 3 6-7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                </button>
              );
            })
          : items.map((item) => <ShoppingItemRow key={item.id} item={item} />)}
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">선택한 항목 {selectedIds.size}개를 삭제할까요?</p>
          <p className="mt-2 text-xs text-ink-soft">되돌릴 수 없어요.</p>
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
              onClick={confirmDelete}
              disabled={deletePending}
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {deletePending ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleShoppingItem, deleteShoppingItem } from "@/lib/actions/shopping";
import { ShoppingItemLink } from "./shopping-item-link";
import type { ShoppingItem } from "@/lib/types";

const REVEAL_WIDTH = 72;
const OVERDRAG = 24;

export function ShoppingItemRow({ item }: { item: ShoppingItem }) {
  const [dragX, setDragX] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const [, startToggleTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = { startX: e.clientX, startOffset: open ? -REVEAL_WIDTH : 0 };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragStateRef.current;
    if (!drag) return;
    const delta = e.clientX - drag.startX;
    setDragX(Math.min(0, Math.max(-REVEAL_WIDTH - OVERDRAG, drag.startOffset + delta)));
  }

  function endDrag() {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    setDragging(false);
    setDragX((current) => {
      const shouldOpen = current < -REVEAL_WIDTH / 2;
      setOpen(shouldOpen);
      return shouldOpen ? -REVEAL_WIDTH : 0;
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      await deleteShoppingItem(formData);
      router.refresh();
    });
  }

  return (
    <div className="relative overflow-hidden border-b border-border">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deletePending}
        aria-label="삭제"
        style={{ width: REVEAL_WIDTH }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-warn text-xs font-bold text-white disabled:opacity-60"
      >
        삭제
      </button>

      <div
        className="group flex items-center gap-3 bg-white py-2.5"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 150ms ease-out",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type="button"
          onClick={() => {
            startToggleTransition(async () => {
              const formData = new FormData();
              formData.set("id", item.id);
              formData.set("nextChecked", (!item.checked).toString());
              await toggleShoppingItem(formData);
              router.refresh();
            });
          }}
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-150 ${
            item.checked ? "border-positive bg-positive" : "border-border bg-surface"
          }`}
        >
          {item.checked && (
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
          )}
        </button>

        <p
          className={`min-w-0 flex-1 truncate text-sm font-semibold transition-colors duration-150 ${
            item.checked ? "text-ink-faint line-through" : "text-ink"
          }`}
        >
          {item.name}
        </p>

        <ShoppingItemLink id={item.id} name={item.name} checked={item.checked} />

        {/* Tailwind's hover variant only matches @media (hover: hover), so
            this stays invisible (and inert-looking) on touch devices, which
            get the swipe-to-delete gesture above instead. */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePending}
          aria-label="삭제"
          title="삭제"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint opacity-0 transition-opacity duration-150 hover:bg-surface group-hover:opacity-100 disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

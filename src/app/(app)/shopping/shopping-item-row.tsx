"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
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
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
    captured: boolean;
  } | null>(null);
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(item.checked);
  const [, startToggleTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Tapping anywhere outside this row while it's swiped open snaps it back
  // closed, so only one row's delete action stays revealed at a time.
  useEffect(() => {
    if (!open) return;
    function handleOutsidePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setDragX(0);
      }
    }
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open]);

  // Capture is deferred until the pointer has actually moved past a small
  // threshold — capturing on every pointerdown (including a plain tap on the
  // checkbox or cart-icon link nested inside this row) retargets the
  // resulting click to this div, silently swallowing taps on those buttons
  // before they ever reach the real target.
  const DRAG_THRESHOLD = 8;

  function handlePointerDown(e: React.PointerEvent) {
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startOffset: open ? -REVEAL_WIDTH : 0,
      captured: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragStateRef.current;
    if (!drag) return;
    const delta = e.clientX - drag.startX;
    if (!drag.captured) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      e.currentTarget.setPointerCapture(drag.pointerId);
      drag.captured = true;
      setDragging(true);
    }
    setDragX(Math.min(0, Math.max(-REVEAL_WIDTH - OVERDRAG, drag.startOffset + delta)));
  }

  function endDrag() {
    const drag = dragStateRef.current;
    if (!drag) return;
    dragStateRef.current = null;
    if (!drag.captured) return;
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
    <div ref={containerRef} className="relative overflow-hidden border-b border-border">
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
        className="flex items-center gap-3 bg-white py-2.5"
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
            const nextChecked = !optimisticChecked;
            startToggleTransition(async () => {
              setOptimisticChecked(nextChecked);
              const formData = new FormData();
              formData.set("id", item.id);
              formData.set("nextChecked", nextChecked.toString());
              await toggleShoppingItem(formData);
              router.refresh();
            });
          }}
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-150 ${
            optimisticChecked ? "border-positive bg-positive" : "border-border bg-surface"
          }`}
        >
          {optimisticChecked && (
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
          )}
        </button>

        <p
          className={`min-w-0 flex-1 truncate text-sm font-semibold transition-colors duration-150 ${
            optimisticChecked ? "text-ink-faint" : "text-ink"
          }`}
        >
          {item.name}
        </p>

        <ShoppingItemLink id={item.id} name={item.name} checked={optimisticChecked} />
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";

// Shared pointer-drag reorder gesture: press a handle, drag past half a
// row/tile's size to swap it with its neighbor, release to settle. Used for
// both vertical lists (recipe list, bookmark list) and PhotoPicker's
// horizontal photo strip — `axis` picks which pointer coordinate and CSS
// transform to drive, `gap` accounts for spacing between rows/tiles that
// isn't part of their own measured size.
export function useDragReorder<T extends { id: string }>(
  initial: T[],
  options?: { axis?: "x" | "y"; gap?: number }
) {
  const axis = options?.axis ?? "y";
  const gap = options?.gap ?? 0;

  const [order, setOrder] = useState<T[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStateRef = useRef<{ start: number; size: number; index: number } | null>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  function registerRow(id: string) {
    return (el: HTMLElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    };
  }

  function pointerPos(e: React.PointerEvent) {
    return axis === "y" ? e.clientY : e.clientX;
  }

  function handlePointerDown(e: React.PointerEvent, id: string, index: number) {
    const row = rowRefs.current.get(id);
    if (!row) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = row.getBoundingClientRect();
    const size = (axis === "y" ? rect.height : rect.width) + gap;
    dragStateRef.current = { start: pointerPos(e), size, index };
    setDragId(id);
    setDragOffset(0);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const delta = pointerPos(e) - dragState.start;
    const steps = Math.round(delta / dragState.size);
    if (steps !== 0) {
      setOrder((prev) => {
        const from = dragState.index;
        const to = Math.min(Math.max(from + steps, 0), prev.length - 1);
        if (to === from) return prev;
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        dragState.index = to;
        return next;
      });
      dragState.start += steps * dragState.size;
      setDragOffset(delta - steps * dragState.size);
    } else {
      setDragOffset(delta);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;
    setDragId(null);
    setDragOffset(0);
  }

  function dragTransform(id: string): React.CSSProperties | undefined {
    if (dragId !== id) return undefined;
    return {
      transform: axis === "y" ? `translateY(${dragOffset}px)` : `translateX(${dragOffset}px)`,
      position: "relative",
      zIndex: 10,
    };
  }

  return {
    order,
    setOrder,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  };
}

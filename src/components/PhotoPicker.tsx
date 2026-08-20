"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_RECIPE_PHOTOS } from "@/lib/constants";

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.85;
const TILE_GAP = 8;

type PhotoItem = { id: string; url: string; file?: File };

// Recipe photos are shown as squares everywhere (list thumbnails, the detail
// page), so center-crop to 1:1 and cap the dimension client-side. This also
// keeps uploads well under the server action's body size limit — a raw
// camera photo can be 10x that.
function cropAndResizeToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const size = Math.min(side, MAX_DIMENSION);

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unsupported"));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("이미지를 처리하지 못했어요."));
            return;
          }
          const name = file.name.replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 불러오지 못했어요."));
    };
    img.src = objectUrl;
  });
}

// The order (and interleaving of kept-existing vs newly-uploaded photos) is
// carried as a single ordered token list, so the server can reconstruct the
// final array after uploading only the new files: "existing:<url>" reuses a
// url as-is, "new:<i>" points at the i-th file in the "photos" file input
// (in submission order).
function buildOrderTokens(items: PhotoItem[]) {
  let newIndex = 0;
  const tokens: string[] = [];
  const newFiles: File[] = [];
  for (const item of items) {
    if (item.file) {
      tokens.push(`new:${newIndex}`);
      newFiles.push(item.file);
      newIndex++;
    } else {
      tokens.push(`existing:${item.url}`);
    }
  }
  return { tokens, newFiles };
}

export function PhotoPicker({
  name,
  existingUrls = [],
  max = MAX_RECIPE_PHOTOS,
  onCountChange,
}: {
  name: string;
  existingUrls?: string[];
  max?: number;
  onCountChange?: (count: number) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PhotoItem[]>(() => existingUrls.map((url) => ({ id: url, url })));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStateRef = useRef<{ startX: number; colWidth: number; index: number } | null>(null);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { tokens: orderTokens, newFiles } = buildOrderTokens(items);

  useEffect(() => {
    const transfer = new DataTransfer();
    newFiles.forEach((file) => transfer.items.add(file));
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    onCountChange?.(items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    const remaining = max - items.length;
    const accepted = picked.slice(0, remaining);
    setError(picked.length > remaining ? `최대 ${max}장까지 등록할 수 있어요.` : null);
    if (accepted.length === 0) return;

    setProcessing(true);
    try {
      const resized = await Promise.all(accepted.map(cropAndResizeToSquare));
      setItems((prev) => [
        ...prev,
        ...resized.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file })),
      ]);
    } catch {
      setError("사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.");
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  }

  function handleDragPointerDown(e: React.PointerEvent, id: string, index: number) {
    const tile = tileRefs.current.get(id);
    if (!tile) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX,
      colWidth: tile.getBoundingClientRect().width + TILE_GAP,
      index,
    };
    setDragId(id);
    setDragOffset(0);
  }

  function handleDragPointerMove(e: React.PointerEvent) {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startX;
    const steps = Math.round(deltaX / dragState.colWidth);
    if (steps !== 0) {
      setItems((prev) => {
        const from = dragState.index;
        const to = Math.min(Math.max(from + steps, 0), prev.length - 1);
        if (to === from) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        dragState.index = to;
        return next;
      });
      dragState.startX += steps * dragState.colWidth;
      setDragOffset(deltaX - steps * dragState.colWidth);
    } else {
      setDragOffset(deltaX);
    }
  }

  function handleDragPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;
    setDragId(null);
    setDragOffset(0);
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, index) => {
          const dragging = dragId === item.id;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) tileRefs.current.set(item.id, el);
                else tileRefs.current.delete(item.id);
              }}
              onPointerDown={(e) => handleDragPointerDown(e, item.id, index)}
              onPointerMove={handleDragPointerMove}
              onPointerUp={handleDragPointerUp}
              onPointerCancel={handleDragPointerUp}
              style={
                dragging
                  ? { transform: `translateX(${dragOffset}px)`, position: "relative", zIndex: 10 }
                  : undefined
              }
              className={`relative aspect-square w-20 shrink-0 touch-none overflow-hidden rounded-2xl bg-surface ${dragging ? "shadow-lg" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" draggable={false} />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeItem(item.id)}
                aria-label="사진 삭제"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}

        {items.length < max && (
          <label
            htmlFor={inputId}
            className="relative flex aspect-square w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-surface"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-bold text-white">
                처리 중...
              </div>
            )}
          </label>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        name={name}
        accept="image/*"
        multiple
        onChange={handlePick}
        className="sr-only"
      />
      <input type="hidden" name="photoOrder" value={JSON.stringify(orderTokens)} readOnly />

      <p className="mt-1.5 text-[11px] text-ink-faint">
        {items.length}/{max}장 · 눌러서 끌면 순서를 바꿀 수 있어요
      </p>
      {error && <p className="mt-1 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

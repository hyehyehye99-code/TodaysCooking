"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_RECIPE_PHOTOS } from "@/lib/constants";
import { useDragReorder } from "@/lib/useDragReorder";
import { useDict } from "@/lib/i18n/client";

const MAX_DIMENSION = 1080;
// A fresh photo straight from an iPad/iPhone camera can be 40+ megapixels.
// Decoding that at full resolution into an <img> (as this used to do)
// forced WKWebView's content process to hold the whole decoded bitmap in
// memory just to immediately downscale it — on iPadOS this was crashing
// the app outright (reported by App Store review) rather than throwing a
// catchable error. createImageBitmap's resize option decodes directly at a
// bounded size instead, so the full-resolution image is never materialized.
const MAX_DECODE_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const TILE_GAP = 8;

type PhotoItem = { id: string; url: string; file?: File };

async function decodeBounded(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { resizeWidth: MAX_DECODE_DIMENSION, resizeQuality: "medium" });
  } catch {
    // Older engines without the resize option (or a odd decode failure)
    // still get a correct result, just without the memory bound.
    return await createImageBitmap(file);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지를 처리하지 못했어요."))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

// Recipe photos are shown as squares everywhere (list thumbnails, the detail
// page), so center-crop to 1:1 and cap the dimension client-side. This also
// keeps uploads well under the server action's body size limit — a raw
// camera photo can be 10x that.
async function cropAndResizeToSquare(file: File): Promise<File> {
  const bitmap = await decodeBounded(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const size = Math.min(side, MAX_DIMENSION);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

    const blob = await canvasToBlob(canvas);
    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
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
  const dict = useDict();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    order: items,
    setOrder: setItems,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  } = useDragReorder<PhotoItem>(
    existingUrls.map((url) => ({ id: url, url })),
    { axis: "x", gap: TILE_GAP }
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tokens: orderTokens, newFiles } = buildOrderTokens(items);

  useEffect(() => {
    const transfer = new DataTransfer();
    newFiles.forEach((file) => transfer.items.add(file));
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    const remaining = max - items.length;
    const accepted = picked.slice(0, remaining);
    setError(picked.length > remaining ? dict.components.photoMaxTemplate.replace("{max}", String(max)) : null);
    if (accepted.length === 0) return;

    setProcessing(true);
    try {
      const resized = await Promise.all(accepted.map(cropAndResizeToSquare));
      const next = [
        ...items,
        ...resized.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file })),
      ];
      setItems(next);
      onCountChange?.(next.length);
    } catch {
      setError(dict.components.photoProcessError);
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function removeItem(id: string) {
    const target = items.find((i) => i.id === id);
    if (target?.file) URL.revokeObjectURL(target.url);
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onCountChange?.(next.length);
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, index) => {
          const dragging = dragId === item.id;
          return (
            <div
              key={item.id}
              ref={registerRow(item.id)}
              onPointerDown={(e) => handlePointerDown(e, item.id, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={dragTransform(item.id)}
              className={`relative aspect-square w-20 shrink-0 touch-none overflow-hidden rounded-2xl bg-surface ${dragging ? "shadow-lg" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" draggable={false} />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeItem(item.id)}
                aria-label={dict.components.deletePhoto}
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
                {dict.components.processing}
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
        {dict.components.photoCountHintTemplate
          .replace("{count}", String(items.length))
          .replace("{max}", String(max))}
      </p>
      {error && <p className="mt-1 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

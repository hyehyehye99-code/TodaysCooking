"use client";

import { useId, useRef, useState } from "react";

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.85;

// Recipe photos are shown as squares everywhere (list thumbnails, the detail
// page), so center-crop to 1:1 and cap the dimension client-side. This also
// keeps the upload well under the server action's body size limit — a raw
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

export function PhotoPicker({
  name,
  defaultPreviewUrl,
}: {
  name: string;
  defaultPreviewUrl?: string | null;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(defaultPreviewUrl ?? null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setProcessing(true);
    try {
      const resized = await cropAndResizeToSquare(picked);
      const transfer = new DataTransfer();
      transfer.items.add(resized);
      if (inputRef.current) inputRef.current.files = transfer.files;
      setPreview(URL.createObjectURL(resized));
    } catch {
      setError("사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="relative flex aspect-square w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-surface"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <circle cx="8.5" cy="10" r="1.4" />
            <path d="M21 15.5l-5-4.5-4 3.5-2-1.5-5 4" />
          </svg>
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-bold text-white">
            처리 중...
          </div>
        )}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
      />
      {error && <p className="mt-1.5 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

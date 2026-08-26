"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCookLog, deleteCookLog } from "@/lib/actions/recipes";
import { Modal } from "@/components/Modal";
import { useDict } from "@/lib/i18n/client";
import type { RecipeCookLog } from "@/lib/types";

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.85;

// Same crop-to-square-and-downsize idea as PhotoPicker (not shared from
// there since that one is wired to its own multi-photo/reorder state) —
// keeps a raw camera photo from tripping the server action's body size
// limit before it ever reaches the network.
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
          resolve(new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 열지 못했어요."));
    };
    img.src = objectUrl;
  });
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className="flex h-8 w-8 items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill={n <= value ? "var(--color-warn)" : "none"}
            stroke={n <= value ? "var(--color-warn)" : "var(--color-ink-faint)"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function CookLogSection({
  recipeId,
  recipeTitle,
  logs,
}: {
  recipeId: string;
  recipeTitle: string;
  logs: RecipeCookLog[];
}) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    setPreview(null);
    setFile(null);
    setRating(0);
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    try {
      const resized = await cropAndResizeToSquare(picked);
      setFile(resized);
      setPreview(URL.createObjectURL(resized));
    } catch {
      setError(dict.recipes.cookLogPhotoError);
    }
  }

  function submit() {
    startTransition(async () => {
      const result = await addCookLog({ recipeId, recipeTitle, rating: rating || null, photo: file });
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteCookLog(id, recipeId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 border-t border-border pt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-bold">
          {dict.recipes.cookLogHeading}
          {logs.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-ink-faint">{logs.length}</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-accent px-3.5 py-2 text-xs font-bold text-white"
        >
          {dict.recipes.cookedItButton}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {logs.map((log) => (
            <div key={log.id} className="relative shrink-0">
              {log.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={log.photo_url}
                  alt=""
                  className="h-24 w-24 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl bg-surface text-ink-faint">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3.5v6M8.5 3.5v3a1.75 1.75 0 0 0 3.5 0v-3M15.5 3.5c-1.1 0-2 1.34-2 3s.9 3 2 3v11" />
                  </svg>
                  <span className="text-[10px] font-semibold">
                    {new Date(log.cooked_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
                aria-label={dict.common.delete}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
              {log.rating && (
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5">
                  <svg viewBox="0 0 24 24" width="9" height="9" fill="var(--color-warn)" stroke="var(--color-warn)" strokeWidth="1.6">
                    <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
                  </svg>
                  <span className="text-[10px] font-bold text-white">{log.rating}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={close} variant="sheet">
        <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          <p className="mb-4 text-[15px] font-bold">{dict.recipes.cookedItButton}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />

          {preview ? (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-40 w-40 rounded-xl object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-40 w-40 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-ink-faint"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8a2 2 0 0 1 2-2h1l1.5-2h7L17 6h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span className="text-xs font-semibold">{dict.recipes.cookLogAddPhoto}</span>
            </button>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-bold text-ink-soft">{dict.recipes.cookLogRatingLabel}</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {error && <p className="mt-3 text-xs text-warn-ink">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? dict.recipes.saving : dict.common.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

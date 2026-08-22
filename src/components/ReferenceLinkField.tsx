"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { generateRecipeFromLink } from "@/lib/actions/ai-recipe";
import { ClearableInput } from "@/components/ClearableInput";

type Preview = { title: string | null; thumbnailUrl: string | null; domain: string | null };
type AiResult = { title: string | null; ingredients: string[]; instructions: string; tags: string[] };

const DEBOUNCE_MS = 700;

export function ReferenceLinkField({
  name,
  defaultValue = "",
  initialPreview = null,
  onAiResult,
}: {
  name: string;
  defaultValue?: string;
  initialPreview?: Preview | null;
  onAiResult?: (result: AiResult) => void;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState<Preview | null>(initialPreview);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedUrlRef = useRef<string>(defaultValue);

  function load(value: string) {
    const trimmed = value.trim();
    requestedUrlRef.current = trimmed;
    if (!trimmed) {
      setPreview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchLinkPreview(trimmed).then((result) => {
      if (requestedUrlRef.current !== trimmed) return; // a newer request superseded this one
      setLoading(false);
      if (result.ok && (result.title || result.thumbnailUrl)) {
        setPreview({ title: result.title, thumbnailUrl: result.thumbnailUrl, domain: result.domain });
      } else {
        setPreview(null);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUrl(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => load(value), DEBOUNCE_MS);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    load(url);
  }

  async function handleAiFill() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAiLoading(true);
    setAiError(null);
    const result = await generateRecipeFromLink(trimmed);
    setAiLoading(false);
    if (!result.ok) {
      setAiError(result.error);
      return;
    }
    onAiResult?.(result);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div>
      <ClearableInput
        name={name}
        type="url"
        value={url}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="https://..."
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
      />

      {loading && <p className="mt-2 text-xs text-ink-faint">미리보기를 불러오는 중...</p>}

      {!loading && preview && (preview.title || preview.thumbnailUrl) && (
        <div className="mt-3 flex gap-3">
          <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
            {preview.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="line-clamp-2 text-[13px] font-bold leading-snug">
              {preview.title || "참고 링크"}
            </p>
            {preview.domain && <span className="text-[11px] text-ink-faint">{preview.domain}</span>}
          </div>
        </div>
      )}

      {!loading && preview && onAiResult && (
        <>
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiLoading}
            className="mt-3 w-full rounded-xl border border-accent bg-white py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
          >
            {aiLoading ? "AI가 작성하는 중..." : "✨ AI로 재료·레시피 자동 작성"}
          </button>
          {aiError && <p className="mt-2 text-xs text-warn-ink">{aiError}</p>}
        </>
      )}
    </div>
  );
}

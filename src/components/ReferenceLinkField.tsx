"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

type Preview = { title: string | null; thumbnailUrl: string | null; domain: string | null };

const DEBOUNCE_MS = 700;

export function ReferenceLinkField({
  name,
  defaultValue = "",
  initialPreview = null,
}: {
  name: string;
  defaultValue?: string;
  initialPreview?: Preview | null;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState<Preview | null>(initialPreview);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div>
      <input
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
    </div>
  );
}

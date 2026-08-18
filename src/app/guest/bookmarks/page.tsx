"use client";

import { useState, useTransition } from "react";
import { useGuestData } from "@/lib/guest/useGuestData";
import { GUEST_LIMITS, newId } from "@/lib/guest/storage";
import { GlassCard, PageHeader } from "@/components/ui";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

export default function GuestBookmarksPage() {
  const { data, update, hydrated } = useGuestData();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!hydrated) return null;

  function handleAdd() {
    setError("");
    if (data.bookmarks.length >= GUEST_LIMITS.bookmarks) {
      setError(`게스트는 북마크를 최대 ${GUEST_LIMITS.bookmarks}개까지 저장할 수 있어요.`);
      return;
    }
    const value = url.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await fetchLinkPreview(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      update((prev) => ({
        ...prev,
        bookmarks: [
          {
            id: newId(),
            url: result.url,
            title: result.title,
            domain: result.domain,
            thumbnailUrl: result.thumbnailUrl,
            createdAt: new Date().toISOString(),
          },
          ...prev.bookmarks,
        ],
      }));
      setUrl("");
    });
  }

  function remove(id: string) {
    update((prev) => ({ ...prev, bookmarks: prev.bookmarks.filter((b) => b.id !== id) }));
  }

  return (
    <div>
      <PageHeader title="북마크" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 rounded-2xl border border-transparent bg-surface px-3.5 py-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="링크를 붙여넣어 저장하세요"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={handleAdd}
            disabled={pending}
            className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
        {error && <p className="px-1 text-xs text-warn-ink">{error}</p>}
      </div>

      {data.bookmarks.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          레시피 링크를 저장해두면 여기 모여요.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {data.bookmarks.map((b) => (
          <GlassCard key={b.id} className="flex gap-3 bg-white p-2.5">
            <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
              {b.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="var(--color-ink-faint)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-[13px] font-bold leading-snug"
              >
                {b.title || b.url}
              </a>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-faint">{b.domain}</span>
                <button onClick={() => remove(b.id)} className="text-[11px] text-ink-faint">
                  삭제
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

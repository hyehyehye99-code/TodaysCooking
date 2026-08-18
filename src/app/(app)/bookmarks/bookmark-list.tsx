"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { deleteBookmark } from "@/lib/actions/bookmarks";
import type { Bookmark } from "@/lib/types";

type BookmarkWithRecipe = Bookmark & { recipes: { title: string } | null };

export function BookmarkList({ bookmarks }: { bookmarks: BookmarkWithRecipe[] }) {
  const [query, setQuery] = useState("");

  const filtered = bookmarks.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (b.title ?? "").toLowerCase().includes(q) ||
      (b.domain ?? "").toLowerCase().includes(q) ||
      (b.recipes?.title ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="북마크 검색"
        className="mb-4 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      {bookmarks.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">
          레시피 링크를 저장해두면 여기 모여요.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">검색 결과가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <GlassCard key={b.id} className="flex gap-3 bg-white p-2.5">
              <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
                {b.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                {b.recipe_id && b.recipes && (
                  <Link
                    href={`/recipes/${b.recipe_id}`}
                    className="inline-flex w-fit items-center rounded-full bg-accent/8 px-2 py-0.5 text-[10px] font-bold text-accent"
                  >
                    {b.recipes.title} 레시피
                  </Link>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-ink-faint">{b.domain}</span>
                  <form action={deleteBookmark}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-[11px] text-ink-faint">
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

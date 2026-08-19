"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { deleteBookmark, updateBookmarkNote } from "@/lib/actions/bookmarks";
import type { Bookmark } from "@/lib/types";

type BookmarkWithRecipe = Bookmark & { recipes: { title: string } | null };

function BookmarkNote({ id, note }: { id: string; note: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateBookmarkNote(id, value);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          autoFocus
          placeholder="메모 입력"
          className="min-w-0 flex-1 rounded-lg bg-surface px-2 py-1.5 text-xs outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-2 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "..." : "저장"}
        </button>
      </div>
    );
  }

  if (note) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1.5 block w-full truncate text-left text-xs text-ink-soft"
      >
        {note}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-1.5 text-xs font-semibold text-accent"
    >
      + 메모 추가
    </button>
  );
}

function DeleteBookmarkButton({
  id,
  linkedToRecipe,
}: {
  id: string;
  linkedToRecipe: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    startTransition(async () => {
      const form = new FormData();
      form.set("id", id);
      await deleteBookmark(form);
      setConfirming(false);
    });
  }

  if (!linkedToRecipe) {
    return (
      <form action={deleteBookmark}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-[11px] text-ink-faint">
          삭제
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-ink-faint"
      >
        삭제
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-bold text-ink">레시피에서도 사라져요</p>
            <p className="mt-2 text-xs text-ink-soft">
              이 북마크는 레시피의 참고 링크로도 쓰이고 있어요. 삭제하면 레시피에서도 이 링크가
              사라져요.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={pending}
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {pending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
                  <DeleteBookmarkButton id={b.id} linkedToRecipe={!!(b.recipe_id && b.recipes)} />
                </div>
                <BookmarkNote id={b.id} note={b.note} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

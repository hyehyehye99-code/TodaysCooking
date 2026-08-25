"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { deleteBookmark, updateBookmarkNote, reorderBookmarks } from "@/lib/actions/bookmarks";
import { useDragReorder } from "@/lib/useDragReorder";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";
import type { Bookmark } from "@/lib/types";

type BookmarkWithRecipe = Bookmark & { recipes: { title: string } | null };

function BookmarkNote({ id, note }: { id: string; note: string | null }) {
  const dict = useDict();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      await updateBookmarkNote(id, value);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 border-t border-border pt-2">
        <div className="min-w-0 flex-1">
          <ClearableInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            autoFocus
            placeholder={dict.bookmarks.noteInputPlaceholder}
            className="w-full rounded-lg bg-surface px-2 py-1.5 text-xs outline-none"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-2 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "..." : dict.common.save}
        </button>
      </div>
    );
  }

  if (value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block w-full truncate border-t border-border pt-2 text-left text-xs text-ink-soft"
      >
        {value}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-fit border-t border-border pt-2 text-xs font-semibold text-ink-soft"
    >
      {dict.bookmarks.addNote}
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
  const dict = useDict();
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
          {dict.common.delete}
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
        {dict.common.delete}
      </button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={dict.bookmarks.alsoInRecipeTitle}
        description={dict.bookmarks.alsoInRecipeDesc}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={pending}
            className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />
    </>
  );
}

export function BookmarkList({ bookmarks }: { bookmarks: BookmarkWithRecipe[] }) {
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [reordering, setReordering] = useState(false);
  const {
    order,
    setOrder,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  } = useDragReorder<BookmarkWithRecipe>(bookmarks);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = bookmarks.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (b.title ?? "").toLowerCase().includes(q) ||
      (b.domain ?? "").toLowerCase().includes(q) ||
      (b.recipes?.title ?? "").toLowerCase().includes(q) ||
      (b.note ?? "").toLowerCase().includes(q)
    );
  });

  function startReorder() {
    setOrder(bookmarks);
    setReordering(true);
  }

  function saveOrder() {
    startTransition(async () => {
      await reorderBookmarks(order.map((b) => b.id));
      setReordering(false);
      router.refresh();
    });
  }

  return (
    <div>
      {reordering ? (
        <div className="mb-4 flex justify-end gap-2">
          <button
            onClick={() => setReordering(false)}
            disabled={pending}
            className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
          >
            {dict.common.cancel}
          </button>
          <button
            onClick={saveOrder}
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? dict.recipes.saving : dict.recipes.done}
          </button>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <div className="min-w-0 flex-1">
            <ClearableInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.bookmarks.searchPlaceholder}
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          {bookmarks.length > 1 && (
            <button
              onClick={startReorder}
              aria-label={dict.bookmarks.reorder}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-soft"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7l4-4 4 4" />
                <path d="M12 3v14" />
                <path d="M16 17l-4 4-4-4" />
                <path d="M12 21V7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {reordering ? (
        <div className="flex flex-col gap-3">
          {order.map((b, index) => {
            const dragging = dragId === b.id;
            return (
              <div
                key={b.id}
                ref={registerRow(b.id)}
                style={dragTransform(b.id)}
              >
                <GlassCard
                  className={`flex items-center gap-3 bg-white p-2.5 ${dragging ? "shadow-lg" : ""}`}
                >
                  <div className="h-[52px] w-[64px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
                    {b.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-bold">{b.title || b.url}</p>
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => handlePointerDown(e, b.id, index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    aria-label={dict.recipes.dragReorder}
                    className="flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-full bg-surface text-ink-soft"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <circle cx="9" cy="6" r="1.4" />
                      <circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="12" r="1.4" />
                      <circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" />
                      <circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </button>
                </GlassCard>
              </div>
            );
          })}
        </div>
      ) : bookmarks.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">{dict.bookmarks.emptyList}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">{dict.recipes.emptySearch}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <GlassCard key={b.id} className="flex flex-col gap-2 bg-white p-2.5">
              <div className="flex gap-3">
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
                      {dict.bookmarks.linkedRecipeTemplate.replace("{title}", b.recipes.title)}
                    </Link>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-faint">{b.domain}</span>
                    <DeleteBookmarkButton id={b.id} linkedToRecipe={!!(b.recipe_id && b.recipes)} />
                  </div>
                </div>
              </div>
              <BookmarkNote id={b.id} note={b.note} />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

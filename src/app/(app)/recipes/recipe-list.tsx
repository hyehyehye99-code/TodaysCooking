"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { RecipeThumb } from "@/components/RecipeThumb";
import { reorderRecipes, toggleFavoriteRecipe, deleteRecipes } from "@/lib/actions/recipes";
import type { RecipeWithIngredients } from "@/lib/types";

function FavoriteButton({ recipe }: { recipe: RecipeWithIngredients }) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await toggleFavoriteRecipe(recipe.id, !recipe.is_favorite);
          router.refresh();
        });
      }}
      aria-label="즐겨찾기"
      className="flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill={recipe.is_favorite ? "var(--color-warn)" : "none"}
        stroke={recipe.is_favorite ? "var(--color-warn)" : "var(--color-ink-faint)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    </button>
  );
}

export function RecipeList({
  recipes,
  ownedIngredients,
}: {
  recipes: RecipeWithIngredients[];
  ownedIngredients: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<RecipeWithIngredients[]>(recipes);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStateRef = useRef<{ startY: number; rowHeight: number; index: number } | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [pending, startTransition] = useTransition();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const owned = useMemo(() => new Set(ownedIngredients), [ownedIngredients]);

  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.tags))],
    [recipes]
  );

  const filtered = recipes.filter((r) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !query ||
      r.title.toLowerCase().includes(q) ||
      (r.subtitle ?? "").toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      r.recipe_ingredients.some((ing) => ing.name.toLowerCase().includes(q));
    const matchesTag = !activeTag || r.tags.includes(activeTag);
    const matchesFavorite = !favoritesOnly || r.is_favorite;
    return matchesQuery && matchesTag && matchesFavorite;
  });

  function startReorder() {
    setOrder(recipes);
    setReordering(true);
  }

  function handleDragPointerDown(e: React.PointerEvent, id: string, index: number) {
    const row = rowRefs.current.get(id);
    if (!row) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = { startY: e.clientY, rowHeight: row.getBoundingClientRect().height, index };
    setDragId(id);
    setDragOffset(0);
  }

  function handleDragPointerMove(e: React.PointerEvent) {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const deltaY = e.clientY - dragState.startY;
    const steps = Math.round(deltaY / dragState.rowHeight);
    if (steps !== 0) {
      setOrder((prev) => {
        const from = dragState.index;
        const to = Math.min(Math.max(from + steps, 0), prev.length - 1);
        if (to === from) return prev;
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        dragState.index = to;
        return next;
      });
      dragState.startY += steps * dragState.rowHeight;
      setDragOffset(deltaY - steps * dragState.rowHeight);
    } else {
      setDragOffset(deltaY);
    }
  }

  function handleDragPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;
    setDragId(null);
    setDragOffset(0);
  }

  function saveOrder() {
    startTransition(async () => {
      await reorderRecipes(order.map((r) => r.id));
      setReordering(false);
      router.refresh();
    });
  }

  function startSelecting() {
    setSelectedIds(new Set());
    setSelecting(true);
  }

  function cancelSelecting() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      await deleteRecipes([...selectedIds]);
      setConfirmingDelete(false);
      setSelecting(false);
      setSelectedIds(new Set());
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
            취소
          </button>
          <button
            onClick={saveOrder}
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "저장 중..." : "완료"}
          </button>
        </div>
      ) : selecting ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink-soft">
            {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : "삭제할 메뉴를 선택하세요"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={cancelSelecting}
              disabled={deletePending}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
            >
              취소
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={selectedIds.size === 0 || deletePending}
              className="rounded-lg bg-warn px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메뉴, 재료 검색"
            className="min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          {recipes.length > 1 && (
            <>
            <button
              onClick={startReorder}
              aria-label="순서 변경"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-soft"
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
            <button
              onClick={startSelecting}
              aria-label="선택 삭제"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-soft"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                <path d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
            </>
          )}
        </div>
      )}

      {!reordering && !selecting && (recipes.length > 0 || allTags.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeTag === null ? "bg-accent text-white" : "bg-surface text-ink-soft"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFavoritesOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
              favoritesOnly ? "bg-accent text-white" : "bg-surface text-ink-soft"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill={favoritesOnly ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
            </svg>
            즐겨찾기
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeTag === tag ? "bg-accent text-white" : "bg-surface text-ink-soft"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {!reordering && !selecting && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          {recipes.length === 0
            ? "아직 등록된 메뉴가 없어요. 첫 메뉴를 등록해보세요."
            : "검색 결과가 없어요."}
        </p>
      )}

      {reordering ? (
        <div className="flex flex-col gap-3">
          {order.map((recipe, index) => {
            const dragging = dragId === recipe.id;
            return (
              <div
                key={recipe.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(recipe.id, el);
                  else rowRefs.current.delete(recipe.id);
                }}
                style={
                  dragging
                    ? { transform: `translateY(${dragOffset}px)`, position: "relative", zIndex: 10 }
                    : undefined
                }
              >
                <GlassCard
                  className={`flex items-center gap-3 bg-white p-3.5 ${dragging ? "shadow-lg" : ""}`}
                >
                  <RecipeThumb
                    coverPhotoUrl={recipe.cover_photo_urls[0]}
                    iconEmoji={recipe.icon_emoji}
                    linkThumbnailUrl={recipe.bookmarks?.[0]?.thumbnail_url}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{recipe.title}</p>
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => handleDragPointerDown(e, recipe.id, index)}
                    onPointerMove={handleDragPointerMove}
                    onPointerUp={handleDragPointerUp}
                    onPointerCancel={handleDragPointerUp}
                    aria-label="드래그해서 순서 변경"
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
      ) : selecting ? (
        <div className="flex flex-col gap-3">
          {recipes.map((recipe) => {
            const checked = selectedIds.has(recipe.id);
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => toggleSelected(recipe.id)}
                className="block w-full text-left"
              >
                <GlassCard
                  className={`flex items-center gap-3 p-3.5 ${checked ? "bg-accent/8 ring-2 ring-accent" : "bg-white"}`}
                >
                  <RecipeThumb
                    coverPhotoUrl={recipe.cover_photo_urls[0]}
                    iconEmoji={recipe.icon_emoji}
                    linkThumbnailUrl={recipe.bookmarks?.[0]?.thumbnail_url}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{recipe.title}</p>
                  </div>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      checked ? "border-accent bg-accent" : "border-border bg-white"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 7.5l3 3 6-7" />
                      </svg>
                    )}
                  </div>
                </GlassCard>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((recipe) => {
            const makeable = recipe.recipe_ingredients
              .filter((ing) => !ing.skipped)
              .every((ing) => owned.has(ing.name));
            return (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                <RecipeThumb
                  coverPhotoUrl={recipe.cover_photo_urls[0]}
                  iconEmoji={recipe.icon_emoji}
                  linkThumbnailUrl={recipe.bookmarks?.[0]?.thumbnail_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{recipe.title}</p>
                  {recipe.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{recipe.subtitle}</p>
                  )}
                  {(makeable || recipe.tags.length > 0) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {makeable && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-positive/10 px-1.5 py-0.5 text-[10px] font-bold text-positive-ink">
                          <svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 7.5l3 3 6-7" />
                          </svg>
                          바로 만들 수 있어요
                        </span>
                      )}
                      {recipe.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-positive-ink">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <FavoriteButton recipe={recipe} />
              </GlassCard>
            </Link>
            );
          })}
        </div>
      )}

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">선택한 메뉴 {selectedIds.size}개를 삭제할까요?</p>
          <p className="mt-2 text-xs text-ink-soft">삭제하면 되돌릴 수 없어요. 재료와 메모도 함께 사라져요.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deletePending}
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {deletePending ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

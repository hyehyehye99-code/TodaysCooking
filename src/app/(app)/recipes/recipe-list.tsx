"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { reorderRecipes, toggleFavoriteRecipe, deleteRecipes } from "@/lib/actions/recipes";
import { useDragReorder } from "@/lib/useDragReorder";
import { useDict } from "@/lib/i18n/client";
import type { RecipeWithIngredients } from "@/lib/types";

function FavoriteButton({ recipe }: { recipe: RecipeWithIngredients }) {
  const dict = useDict();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(recipe.is_favorite);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !optimisticFavorite;
        startTransition(async () => {
          setOptimisticFavorite(next);
          await toggleFavoriteRecipe(recipe.id, next);
          router.refresh();
        });
      }}
      aria-label={dict.recipes.favorite}
      className="flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill={optimisticFavorite ? "var(--color-warn)" : "none"}
        stroke={optimisticFavorite ? "var(--color-warn)" : "var(--color-ink-faint)"}
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
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [makeableOnly, setMakeableOnly] = useState(false);
  const [editing, setEditing] = useState(false);
  const {
    order,
    setOrder,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  } = useDragReorder<RecipeWithIngredients>(recipes);
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const owned = useMemo(() => new Set(ownedIngredients), [ownedIngredients]);

  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.tags))],
    [recipes]
  );

  const makeableIds = useMemo(
    () =>
      new Set(
        recipes
          .filter((r) =>
            r.recipe_ingredients.filter((ing) => !ing.skipped).every((ing) => owned.has(ing.name))
          )
          .map((r) => r.id)
      ),
    [recipes, owned]
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
    const matchesMakeable = !makeableOnly || makeableIds.has(r.id);
    return matchesQuery && matchesTag && matchesFavorite && matchesMakeable;
  });

  function startEditing() {
    setOrder(recipes);
    setSelectedIds(new Set());
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
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

  function saveOrder() {
    startTransition(async () => {
      await reorderRecipes(order.map((r) => r.id));
      setEditing(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      await deleteRecipes([...selectedIds]);
      setConfirmingDelete(false);
      setEditing(false);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {editing ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-bold text-ink-soft">
            {selectedIds.size > 0
              ? dict.recipes.selectedCountTemplate.replace("{count}", String(selectedIds.size))
              : dict.recipes.selectHint}
          </span>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={cancelEditing}
              disabled={pending || deletePending}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
            >
              {dict.common.cancel}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={pending || deletePending}
                className="rounded-lg bg-warn px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {dict.common.delete}
              </button>
            )}
            <button
              onClick={saveOrder}
              disabled={pending || deletePending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? dict.recipes.saving : dict.recipes.done}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <div className="min-w-0 flex-1">
            <ClearableInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.recipes.searchPlaceholder}
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          {recipes.length > 1 && (
            <button
              onClick={startEditing}
              aria-label={dict.recipes.editMenu}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface text-ink-soft"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
                <path d="M14 7l3 3" />
              </svg>
            </button>
          )}
        </div>
      )}

      {!editing && (recipes.length > 0 || allTags.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeTag === null ? "bg-accent text-white" : "bg-surface text-ink-soft"
            }`}
          >
            {dict.recipes.all}
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
            {dict.recipes.favorite}
          </button>
          <button
            onClick={() => setMakeableOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
              makeableOnly ? "bg-accent text-white" : "bg-surface text-ink-soft"
            }`}
          >
            <svg
              viewBox="0 0 14 14"
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
            {dict.recipes.makeableFilter}
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

      {!editing && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          {recipes.length === 0 ? dict.recipes.emptyNoRecipes : dict.recipes.emptySearch}
        </p>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          {order.map((recipe, index) => {
            const dragging = dragId === recipe.id;
            const checked = selectedIds.has(recipe.id);
            return (
              <div
                key={recipe.id}
                ref={registerRow(recipe.id)}
                style={dragTransform(recipe.id)}
              >
                <GlassCard
                  className={`flex items-center gap-2 p-3.5 ${dragging ? "shadow-lg" : ""} ${
                    checked ? "bg-accent/8 ring-2 ring-accent" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelected(recipe.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <RecipeThumb
                      coverPhotoUrl={recipe.cover_photo_urls[0]}
                      iconEmoji={recipe.icon_emoji}
                      linkThumbnailUrl={recipe.bookmarks?.[0]?.thumbnail_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{recipe.title}</p>
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
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, recipe.id, index);
                    }}
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
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((recipe) => {
            const makeable = makeableIds.has(recipe.id);
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
                          {dict.recipes.makeableBadge}
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

      <ConfirmModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={dict.recipes.deleteSelectedTitleTemplate.replace("{count}", String(selectedIds.size))}
        description={dict.recipes.deleteRecipeDescription}
        confirmSlot={
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deletePending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {deletePending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />
    </div>
  );
}

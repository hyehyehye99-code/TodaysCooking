"use client";

import { useMemo, useState } from "react";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { useDragReorder } from "@/lib/useDragReorder";
import { useDict } from "@/lib/i18n/client";

type PickableRecipe = {
  id: string;
  title: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  bookmarks?: { thumbnail_url: string | null }[] | null;
};

export function RecipePicker({
  name,
  recipes,
  defaultSelected = [],
  untitledLabel,
}: {
  name: string;
  recipes: PickableRecipe[];
  defaultSelected?: string[];
  untitledLabel: string;
}) {
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  // Only used as useDragReorder's initial value (below) — the picker's own
  // recipes/defaultSelected props come from the server and don't change
  // while this form is mounted.
  const initialOrder = useMemo(
    () => defaultSelected.map((id) => byId.get(id)).filter((r): r is PickableRecipe => !!r),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const {
    order,
    setOrder,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  } = useDragReorder<PickableRecipe>(initialOrder);

  const selectedIds = useMemo(() => new Set(order.map((r) => r.id)), [order]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => (r.title ?? untitledLabel).toLowerCase().includes(q));
  }, [recipes, query, untitledLabel]);

  // Tapping an unselected recipe appends it to the ordered list below;
  // tapping one that's already selected (here or in that list) removes it.
  function toggle(recipe: PickableRecipe) {
    setOrder((prev) =>
      prev.some((r) => r.id === recipe.id) ? prev.filter((r) => r.id !== recipe.id) : [...prev, recipe]
    );
  }

  return (
    <div>
      <input type="hidden" name={name} value={order.map((r) => r.id).join(",")} />

      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className="mb-3 w-full rounded-xl border border-dashed border-accent bg-white py-2.5 text-xs font-bold text-accent-ink"
      >
        {pickerOpen ? dict.mealPlan.closeRecipePicker : dict.mealPlan.addRecipeButton}
      </button>

      {pickerOpen && (
        <>
          <ClearableInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.recipes.searchPlaceholder}
            className="mb-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-faint">{dict.recipes.emptySearch}</p>
            )}
            {filtered.map((r) => {
              const active = selectedIds.has(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                    active ? "border-accent bg-accent/8" : "border-transparent bg-surface"
                  }`}
                >
                  <RecipeThumb
                    coverPhotoUrl={r.cover_photo_urls[0]}
                    iconEmoji={r.icon_emoji}
                    linkThumbnailUrl={r.bookmarks?.[0]?.thumbnail_url}
                    size={40}
                    rounded="rounded-lg"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.title || untitledLabel}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-accent bg-accent" : "border-border bg-white"
                    }`}
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {order.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-ink-soft">
            {dict.recipes.selectedCountTemplate.replace("{count}", String(order.length))}
          </p>
          <div className="flex flex-col gap-2">
            {order.map((r, index) => {
              const dragging = dragId === r.id;
              return (
                <div key={r.id} ref={registerRow(r.id)} style={dragTransform(r.id)}>
                  <div
                    className={`flex items-center gap-2 rounded-xl bg-surface p-2.5 ${dragging ? "shadow-lg" : ""}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink-soft">
                      {index + 1}
                    </span>
                    <RecipeThumb
                      coverPhotoUrl={r.cover_photo_urls[0]}
                      iconEmoji={r.icon_emoji}
                      linkThumbnailUrl={r.bookmarks?.[0]?.thumbnail_url}
                      size={32}
                      rounded="rounded-lg"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.title || untitledLabel}</span>
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      aria-label={dict.common.delete}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e, r.id, index);
                      }}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      aria-label={dict.recipes.dragReorder}
                      className="flex h-7 w-7 shrink-0 touch-none items-center justify-center rounded-full text-ink-soft"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <circle cx="9" cy="6" r="1.4" />
                        <circle cx="15" cy="6" r="1.4" />
                        <circle cx="9" cy="12" r="1.4" />
                        <circle cx="15" cy="12" r="1.4" />
                        <circle cx="9" cy="18" r="1.4" />
                        <circle cx="15" cy="18" r="1.4" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

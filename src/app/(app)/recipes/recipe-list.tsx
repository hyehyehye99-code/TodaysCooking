"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { reorderRecipes, toggleFavoriteRecipe } from "@/lib/actions/recipes";
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

function RecipeThumb({ recipe }: { recipe: RecipeWithIngredients }) {
  if (recipe.cover_photo_url) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={recipe.cover_photo_url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (recipe.icon_emoji) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl">
        {recipe.icon_emoji}
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5c2.2-1 5.2-1 8 0 2.8-1 5.8-1 8 0v13c-2.2-1-5.2-1-8 0-2.8-1-5.8-1-8 0z" />
        <path d="M12 5.5v13" />
      </svg>
    </div>
  );
}

export function RecipeList({ recipes }: { recipes: RecipeWithIngredients[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<RecipeWithIngredients[]>(recipes);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.tags))],
    [recipes]
  );

  const filtered = recipes.filter((r) => {
    const matchesQuery =
      !query ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      (r.subtitle ?? "").toLowerCase().includes(query.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesTag = !activeTag || r.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });

  function startReorder() {
    setOrder(recipes);
    setReordering(true);
  }

  function move(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function saveOrder() {
    startTransition(async () => {
      await reorderRecipes(order.map((r) => r.id));
      setReordering(false);
      router.refresh();
    });
  }

  return (
    <div>
      {!reordering && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="레시피 검색"
          className="mb-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      )}

      <div className="mb-4 flex justify-end">
        {reordering ? (
          <div className="flex gap-2">
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
        ) : (
          recipes.length > 1 && (
            <button
              onClick={startReorder}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft"
            >
              순서 변경
            </button>
          )
        )}
      </div>

      {!reordering && allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeTag === null ? "bg-accent text-white" : "bg-surface text-ink-soft"
            }`}
          >
            전체
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

      {!reordering && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          {recipes.length === 0
            ? "아직 등록된 레시피가 없어요. 첫 레시피를 등록해보세요."
            : "검색 결과가 없어요."}
        </p>
      )}

      {reordering ? (
        <div className="flex flex-col gap-3">
          {order.map((recipe, index) => (
            <GlassCard key={recipe.id} className="flex items-center gap-3 bg-white p-3.5">
              <RecipeThumb recipe={recipe} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">{recipe.title}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-soft disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-soft disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                <RecipeThumb recipe={recipe} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{recipe.title}</p>
                  {recipe.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{recipe.subtitle}</p>
                  )}
                  {recipe.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {recipe.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-accent">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <FavoriteButton recipe={recipe} />
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

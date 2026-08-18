"use client";

import Link from "next/link";
import { useGuestData } from "@/lib/guest/useGuestData";
import { GUEST_LIMITS } from "@/lib/guest/storage";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";
import type { GuestRecipe } from "@/lib/guest/storage";

export default function GuestRecipesPage() {
  const { data, update, hydrated } = useGuestData();

  if (!hydrated) return null;

  const owned = data.fridge;
  const items = data.recipes;
  const makeableCount = items.filter((r) => r.ingredients.every((n) => owned[n])).length;

  function deleteRecipe(id: string) {
    update((prev) => ({ ...prev, recipes: prev.recipes.filter((r) => r.id !== id) }));
  }

  function addMissingToShopping(recipe: GuestRecipe, missingNames: string[]) {
    update((prev) => {
      const existingNames = new Set(prev.shopping.map((s) => s.name));
      const toAdd = missingNames.filter((n) => !existingNames.has(n));
      const capLeft = GUEST_LIMITS.shopping - prev.shopping.length;
      const added = toAdd.slice(0, Math.max(0, capLeft)).map((n) => ({
        id: Math.random().toString(36).slice(2, 10),
        name: n,
        checked: false,
        sourceRecipeTitle: recipe.title,
      }));
      return { ...prev, shopping: [...prev.shopping, ...added] };
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <PageHeader title="레시피" />
        {items.length < GUEST_LIMITS.recipes ? (
          <Link href="/guest/recipes/new" className="text-sm font-bold text-accent">
            + 새 레시피
          </Link>
        ) : (
          <span className="text-xs text-ink-faint">최대 {GUEST_LIMITS.recipes}개</span>
        )}
      </div>

      <GlassCard className="mb-4 border-transparent bg-accent/8 px-4 py-3.5">
        <p className="text-sm font-bold text-accent-ink">
          지금 만들 수 있는 레시피 {makeableCount}개
        </p>
        <p className="mt-0.5 text-xs text-accent-ink/70">
          게스트는 레시피를 최대 {GUEST_LIMITS.recipes}개까지 등록할 수 있어요
        </p>
      </GlassCard>

      {items.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          아직 등록된 레시피가 없어요. 첫 레시피를 등록해보세요.
        </p>
      )}

      <div className="flex flex-col gap-3.5">
        {items.map((recipe) => {
          const missing = recipe.ingredients.filter((n) => !owned[n]);
          const makeable = missing.length === 0;
          const allAdded =
            missing.length > 0 && missing.every((n) => data.shopping.some((s) => s.name === n));

          return (
            <GlassCard key={recipe.id} className="flex flex-col gap-3 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/8">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 5.5c2.2-1 5.2-1 8 0 2.8-1 5.8-1 8 0v13c-2.2-1-5.2-1-8 0-2.8-1-5.8-1-8 0z" />
                    <path d="M12 5.5v13" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold">{recipe.title}</p>
                  <p className="text-xs text-ink-soft">
                    {recipe.subtitle}
                    {recipe.subtitle && recipe.cookTimeMinutes ? " · " : ""}
                    {recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes}분` : ""}
                  </p>
                </div>
                <button onClick={() => deleteRecipe(recipe.id)} className="text-xs text-ink-faint">
                  삭제
                </button>
              </div>

              <div>
                <p className="mb-1.5 text-xs text-ink-soft">
                  보유 재료 {recipe.ingredients.length - missing.length}/{recipe.ingredients.length}
                </p>
                <ProgressBar
                  percent={
                    ((recipe.ingredients.length - missing.length) /
                      (recipe.ingredients.length || 1)) *
                    100
                  }
                />
              </div>

              {makeable ? (
                <div className="flex items-center gap-2 rounded-xl border border-transparent bg-positive/10 px-3 py-2.5">
                  <svg
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="var(--color-positive-ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 7.5l3 3 6-7" />
                  </svg>
                  <span className="text-[13px] font-bold text-positive-ink">
                    바로 만들 수 있어요
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-transparent bg-warn/10 px-2.5 py-1 text-xs font-semibold text-warn-ink"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  {allAdded ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-transparent bg-surface py-2.5">
                      <span className="text-[13px] font-bold text-ink-faint">
                        장보기에 담겨 있어요
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => addMissingToShopping(recipe, missing)}
                      className="w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-white"
                    >
                      부족한 재료 장보기 담기
                    </button>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

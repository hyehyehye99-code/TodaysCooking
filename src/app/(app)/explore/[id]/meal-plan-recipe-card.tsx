"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { toggleFridgeStock } from "@/lib/actions/fridge";

type Ingredient = { name: string; amount: string | null; owned: boolean; onShoppingList: boolean };

export function MealPlanRecipeCard({
  recipeId,
  title,
  untitledLabel,
  coverPhotoUrl,
  iconEmoji,
  linkThumbnailUrl,
  ingredients,
}: {
  recipeId: string;
  title: string | null;
  untitledLabel: string;
  coverPhotoUrl?: string;
  iconEmoji: string | null;
  linkThumbnailUrl?: string | null;
  ingredients: Ingredient[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Owned state is really the household's fridge stock, computed server-side
  // — this local override just makes a tap feel instant while the real
  // write lands and router.refresh() reconciles it (and any other card
  // showing the same ingredient name).
  const [optimisticOwned, setOptimisticOwned] = useOptimistic(
    Object.fromEntries(ingredients.map((i) => [i.name, i.owned])) as Record<string, boolean>,
    (state, update: { name: string; owned: boolean }) => ({ ...state, [update.name]: update.owned })
  );

  function toggle(name: string, current: boolean) {
    const next = !current;
    startTransition(async () => {
      setOptimisticOwned({ name, owned: next });
      await toggleFridgeStock(name, next);
      router.refresh();
    });
  }

  return (
    <GlassCard className="bg-white p-3.5">
      <Link href={`/recipes/${recipeId}`} className="mb-2.5 flex items-center gap-2.5">
        <RecipeThumb
          coverPhotoUrl={coverPhotoUrl}
          iconEmoji={iconEmoji}
          linkThumbnailUrl={linkThumbnailUrl}
          size={36}
          rounded="rounded-lg"
        />
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{title || untitledLabel}</span>
      </Link>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => {
            const isOwned = optimisticOwned[ing.name];
            const stateClass = isOwned
              ? "border-accent bg-surface text-accent-ink"
              : ing.onShoppingList
                ? "border-positive bg-surface text-positive-ink"
                : "border-transparent bg-surface text-ink-soft";
            return (
              <button
                key={ing.name}
                type="button"
                onClick={() => toggle(ing.name, isOwned)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${stateClass}`}
              >
                {ing.name}
                {ing.amount && <span className="ml-1 font-normal opacity-70">{ing.amount}</span>}
              </button>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

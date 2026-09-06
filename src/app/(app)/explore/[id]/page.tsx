import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { getDictionary } from "@/lib/i18n/server";
import { MealPlanMenuButton } from "./meal-plan-menu-button";
import { AddMissingButton } from "./add-missing-button";

type RecipeRow = {
  id: string;
  title: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  recipe_ingredients: { name: string; amount: string | null; skipped: boolean }[];
};

type MealPlanRecipeRow = { position: number; recipes: RecipeRow | RecipeRow[] | null };

function unwrapRecipe(value: RecipeRow | RecipeRow[] | null): RecipeRow | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data: mealPlan }, { data: mealPlanRecipes }, { data: fridgeItems }, { data: shoppingItems }] =
    await Promise.all([
      supabase.from("meal_plans").select("id, title").eq("id", id).eq("household_id", household!.id).maybeSingle(),
      supabase
        .from("meal_plan_recipes")
        .select("position, recipes(id, title, cover_photo_urls, icon_emoji, recipe_ingredients(name, amount, skipped))")
        .eq("meal_plan_id", id)
        .order("position", { ascending: true }),
      supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
      supabase.from("shopping_items").select("name").eq("household_id", household!.id),
    ]);

  if (!mealPlan) notFound();

  const recipes = ((mealPlanRecipes as MealPlanRecipeRow[] | null) ?? [])
    .map((mpr) => unwrapRecipe(mpr.recipes))
    .filter((r): r is RecipeRow => r !== null);

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const onShoppingList = new Set((shoppingItems ?? []).map((i) => i.name));

  // One row per unique ingredient name across every recipe in the plan —
  // this is the whole point of a meal plan: instead of checking each
  // recipe's ingredient list on its own, see the combined need at once.
  // Amounts aren't summed (free-text units like "2개"/"반모" can't be added
  // reliably) — each recipe's own amount is kept and shown separately.
  const aggregated = new Map<
    string,
    { name: string; recipeAmounts: { recipeTitle: string; amount: string | null }[] }
  >();
  for (const recipe of recipes) {
    const recipeTitle = recipe.title || dict.recipes.untitledLink;
    for (const ing of recipe.recipe_ingredients) {
      if (ing.skipped) continue;
      const entry = aggregated.get(ing.name) ?? { name: ing.name, recipeAmounts: [] };
      entry.recipeAmounts.push({ recipeTitle, amount: ing.amount });
      aggregated.set(ing.name, entry);
    }
  }
  const ingredients = [...aggregated.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const missingNames = ingredients.filter((i) => !owned.has(i.name) && !onShoppingList.has(i.name)).map((i) => i.name);

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-bold">{mealPlan.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <MealPlanMenuButton mealPlanId={mealPlan.id} />
          <Link
            href="/explore"
            aria-label={dict.common.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${r.id}`}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <RecipeThumb coverPhotoUrl={r.cover_photo_urls[0]} iconEmoji={r.icon_emoji} size={64} />
            <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
              {r.title || dict.recipes.untitledLink}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[15px] font-bold">{dict.mealPlan.ingredientsHeading}</p>

        {ingredients.length === 0 ? (
          <p className="text-xs text-ink-faint">{dict.mealPlan.noIngredients}</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {ingredients.map((ing) => {
                const isOwned = owned.has(ing.name);
                const isOnList = onShoppingList.has(ing.name);
                const stateClass = isOwned
                  ? "border-accent bg-surface text-accent-ink"
                  : isOnList
                    ? "border-positive bg-surface text-positive-ink"
                    : "border-transparent bg-surface text-ink-soft";
                return (
                  <GlassCard key={ing.name} className={`border ${stateClass} p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{ing.name}</span>
                      {isOwned && (
                        <span className="shrink-0 text-[11px] font-bold">{dict.welcome.stateFridge}</span>
                      )}
                      {!isOwned && isOnList && (
                        <span className="shrink-0 text-[11px] font-bold">{dict.mealPlan.onShoppingListBadge}</span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-ink-faint">
                      {ing.recipeAmounts
                        .map((ra) => (ra.amount ? `${ra.recipeTitle} ${ra.amount}` : ra.recipeTitle))
                        .join(" · ")}
                    </p>
                  </GlassCard>
                );
              })}
            </div>

            <div className="mt-4">
              <AddMissingButton mealPlanId={mealPlan.id} missingNames={missingNames} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

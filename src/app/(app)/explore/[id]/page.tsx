import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { MealPlanMenuButton } from "./meal-plan-menu-button";
import { AddMissingButton } from "./add-missing-button";
import { MealPlanRecipeCard } from "./meal-plan-recipe-card";

type RecipeRow = {
  id: string;
  title: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  recipe_ingredients: { name: string; amount: string | null; skipped: boolean }[];
  bookmarks: { thumbnail_url: string | null }[] | null;
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
        .select(
          "position, recipes(id, title, cover_photo_urls, icon_emoji, recipe_ingredients(name, amount, skipped), bookmarks(thumbnail_url))"
        )
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

  // Deduped across every recipe in the plan — only used for the bulk "add
  // missing to shopping" action below, not for display (each recipe shows
  // its own ingredients regardless of whether another recipe also needs
  // the same thing).
  const missingNames = [
    ...new Set(
      recipes
        .flatMap((r) => r.recipe_ingredients)
        .filter((ing) => !ing.skipped)
        .map((ing) => ing.name)
        .filter((name) => !owned.has(name) && !onShoppingList.has(name))
    ),
  ];

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

      <div className="flex flex-col gap-3">
        {recipes.map((r) => (
          <MealPlanRecipeCard
            key={r.id}
            recipeId={r.id}
            title={r.title}
            untitledLabel={dict.recipes.untitledLink}
            coverPhotoUrl={r.cover_photo_urls[0]}
            iconEmoji={r.icon_emoji}
            linkThumbnailUrl={r.bookmarks?.[0]?.thumbnail_url}
            ingredients={r.recipe_ingredients
              .filter((ing) => !ing.skipped)
              .map((ing) => ({
                name: ing.name,
                amount: ing.amount,
                owned: owned.has(ing.name),
                onShoppingList: onShoppingList.has(ing.name),
              }))}
          />
        ))}
      </div>

      <div className="mt-4">
        <AddMissingButton mealPlanId={mealPlan.id} missingNames={missingNames} />
      </div>
    </div>
  );
}

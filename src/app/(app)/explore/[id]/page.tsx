import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import type { IngredientChipState } from "@/lib/actions/recipes";
import { MealPlanPanel } from "./meal-plan-panel";

type RecipeRow = {
  id: string;
  title: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  recipe_ingredients: { name: string; amount: string | null; skipped: boolean }[];
  bookmarks: { thumbnail_url: string | null }[] | null;
};

type MealPlanRow = {
  id: string;
  title: string;
  icon_emoji: string | null;
  event_date: string | null;
  headcount: number | null;
  meal_plan_recipes: {
    position: number;
    display_name: string | null;
    recipes: RecipeRow | RecipeRow[] | null;
  }[];
};

function unwrapRecipe(value: RecipeRow | RecipeRow[] | null): RecipeRow | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data: mealPlan }, { data: fridgeItems }, { data: shoppingItems }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select(
        "id, title, icon_emoji, event_date, headcount, meal_plan_recipes(position, display_name, recipes(id, title, cover_photo_urls, icon_emoji, recipe_ingredients(name, amount, skipped), bookmarks(thumbnail_url)))"
      )
      .eq("id", id)
      .eq("household_id", household!.id)
      .maybeSingle(),
    supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
    supabase.from("shopping_items").select("name").eq("household_id", household!.id),
  ]);

  const plan = mealPlan as MealPlanRow | null;
  if (!plan) notFound();

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const onShoppingList = new Set((shoppingItems ?? []).map((i) => i.name));

  const entries = plan.meal_plan_recipes
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((mpr) => {
      const recipe = unwrapRecipe(mpr.recipes);
      return recipe ? { recipe, displayName: mpr.display_name } : null;
    })
    .filter((e): e is { recipe: RecipeRow; displayName: string | null } => e !== null);

  return (
    <MealPlanPanel
      mealPlanId={plan.id}
      householdName={household!.name}
      title={plan.title}
      iconEmoji={plan.icon_emoji}
      eventDate={plan.event_date}
      headcount={plan.headcount}
      cardRecipes={entries.map((e) => ({
        title: e.displayName || e.recipe.title || dict.recipes.untitledLink,
        // Just names on the shared card — a course-style menu reads better
        // without "된장 2큰술"-style amounts cluttering it.
        ingredientNames: e.recipe.recipe_ingredients.filter((ing) => !ing.skipped).map((ing) => ing.name),
      }))}
      recipes={entries.map((e) => ({
        id: e.recipe.id,
        title: e.recipe.title,
        displayName: e.displayName,
        coverPhotoUrl: e.recipe.cover_photo_urls[0],
        iconEmoji: e.recipe.icon_emoji,
        linkThumbnailUrl: e.recipe.bookmarks?.[0]?.thumbnail_url,
        ingredients: e.recipe.recipe_ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          initialState: (ing.skipped
            ? "skip"
            : owned.has(ing.name)
              ? "fridge"
              : onShoppingList.has(ing.name)
                ? "shopping"
                : "none") as IngredientChipState,
        })),
      }))}
      untitledLabel={dict.recipes.untitledLink}
    />
  );
}

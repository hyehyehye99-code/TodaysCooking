import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import type { IngredientChipState } from "@/lib/actions/recipes";
import { ExploreCarousel, type CarouselPlan } from "./explore-carousel";

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
  event_date: string | null;
  headcount: number | null;
  hidden: boolean;
  meal_plan_recipes: { position: number; recipes: RecipeRow | RecipeRow[] | null }[];
};

function unwrapRecipe(value: RecipeRow | RecipeRow[] | null): RecipeRow | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data: mealPlans }, { data: fridgeItems }, { data: shoppingItems }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select(
        "id, title, event_date, headcount, hidden, meal_plan_recipes(position, recipes(id, title, cover_photo_urls, icon_emoji, recipe_ingredients(name, amount, skipped), bookmarks(thumbnail_url)))"
      )
      .eq("household_id", household!.id)
      .order("created_at", { ascending: false }),
    supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
    supabase.from("shopping_items").select("name").eq("household_id", household!.id),
  ]);

  const allPlans = (mealPlans as MealPlanRow[] | null) ?? [];
  if (!allPlans.some((p) => p.id === id)) notFound();

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const onShoppingList = new Set((shoppingItems ?? []).map((i) => i.name));

  const visiblePlans = allPlans.filter((p) => !p.hidden || p.id === id);

  const carouselPlans: CarouselPlan[] = visiblePlans.map((plan) => {
    const recipes = plan.meal_plan_recipes
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((mpr) => unwrapRecipe(mpr.recipes))
      .filter((r): r is RecipeRow => r !== null);

    const missingNames = [
      ...new Set(
        recipes
          .flatMap((r) => r.recipe_ingredients)
          .filter((ing) => !ing.skipped)
          .map((ing) => ing.name)
          .filter((name) => !owned.has(name) && !onShoppingList.has(name))
      ),
    ];

    return {
      id: plan.id,
      title: plan.title,
      eventDate: plan.event_date,
      headcount: plan.headcount,
      missingNames,
      cardRecipes: recipes.map((r) => ({
        title: r.title || dict.recipes.untitledLink,
        ingredientNames: r.recipe_ingredients
          .filter((ing) => !ing.skipped)
          .map((ing) => (ing.amount ? `${ing.name} ${ing.amount}` : ing.name)),
      })),
      recipes: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        coverPhotoUrl: r.cover_photo_urls[0],
        iconEmoji: r.icon_emoji,
        linkThumbnailUrl: r.bookmarks?.[0]?.thumbnail_url,
        ingredients: r.recipe_ingredients.map((ing) => ({
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
      })),
    };
  });

  return <ExploreCarousel initialPlanId={id} plans={carouselPlans} untitledLabel={dict.recipes.untitledLink} />;
}

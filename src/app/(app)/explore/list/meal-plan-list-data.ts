import type { createClient } from "@/lib/supabase/server";

export type MealPlanListItem = {
  id: string;
  title: string;
  iconEmoji: string | null;
  eventDate: string | null;
  headcount: number | null;
  recipeCount: number;
};

type PlanRow = {
  id: string;
  title: string;
  icon_emoji: string | null;
  event_date: string | null;
  headcount: number | null;
  meal_plan_recipes: { recipe_id: string }[];
};

// Backs the 메뉴판 tab's landing list at /explore.
export async function fetchMealPlanListItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
): Promise<MealPlanListItem[]> {
  const { data } = await supabase
    .from("meal_plans")
    .select("id, title, icon_emoji, event_date, headcount, meal_plan_recipes(recipe_id)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  return ((data as PlanRow[] | null) ?? []).map((plan) => ({
    id: plan.id,
    title: plan.title,
    iconEmoji: plan.icon_emoji,
    eventDate: plan.event_date,
    headcount: plan.headcount,
    recipeCount: plan.meal_plan_recipes.length,
  }));
}

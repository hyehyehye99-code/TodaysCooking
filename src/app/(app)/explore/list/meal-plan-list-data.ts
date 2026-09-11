import type { createClient } from "@/lib/supabase/server";

export type MealPlanListItem = {
  id: string;
  title: string;
  hidden: boolean;
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
  hidden: boolean;
  meal_plan_recipes: { recipe_id: string }[];
};

// Shared by /explore (tab landing) and /explore/list (management sheet) —
// both render the same card list, just with a different close affordance.
export async function fetchMealPlanListItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
): Promise<MealPlanListItem[]> {
  const { data } = await supabase
    .from("meal_plans")
    .select("id, title, icon_emoji, event_date, headcount, hidden, meal_plan_recipes(recipe_id)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  return ((data as PlanRow[] | null) ?? []).map((plan) => ({
    id: plan.id,
    title: plan.title,
    hidden: plan.hidden,
    iconEmoji: plan.icon_emoji,
    eventDate: plan.event_date,
    headcount: plan.headcount,
    recipeCount: plan.meal_plan_recipes.length,
  }));
}

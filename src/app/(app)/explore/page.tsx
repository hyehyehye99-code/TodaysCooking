import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { createClient } from "@/lib/supabase/server";
import { fetchMealPlanListItems } from "./list/meal-plan-list-data";
import { MealPlanList } from "./list/meal-plan-list";

export default async function ExploreIndexPage() {
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="mealPlan" />;
  const supabase = await createClient();

  const plans = await fetchMealPlanListItems(supabase, household!.id);

  return <MealPlanList plans={plans} />;
}

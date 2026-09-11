import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { fetchMealPlanListItems } from "./meal-plan-list-data";
import { MealPlanList } from "./meal-plan-list";

export default async function MealPlanListPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const plans = await fetchMealPlanListItems(supabase, household!.id);

  return <MealPlanList plans={plans} />;
}

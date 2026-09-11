import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { fetchMealPlanListItems } from "./list/meal-plan-list-data";
import { MealPlanList } from "./list/meal-plan-list";

export default async function ExploreIndexPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const plans = await fetchMealPlanListItems(supabase, household!.id);

  return <MealPlanList plans={plans} />;
}

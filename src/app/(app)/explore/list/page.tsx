import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { MealPlanList } from "./meal-plan-list";

export default async function MealPlanListPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, title, hidden")
    .eq("household_id", household!.id)
    .order("created_at", { ascending: false });

  return <MealPlanList plans={plans ?? []} />;
}

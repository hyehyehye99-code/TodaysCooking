import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export default async function ExploreIndexPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const { data: firstPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("household_id", household!.id)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (firstPlan) redirect(`/explore/${firstPlan.id}`);

  return <p className="mt-10 text-center text-sm text-ink-faint">{dict.mealPlan.emptyState}</p>;
}

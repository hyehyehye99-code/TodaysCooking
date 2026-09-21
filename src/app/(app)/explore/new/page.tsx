import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { createClient } from "@/lib/supabase/server";
import { NewMealPlanForm } from "./new-meal-plan-form";

export default async function NewMealPlanPage() {
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="mealPlan" />;
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, cover_photo_urls, icon_emoji, is_cooking, bookmarks(thumbnail_url)")
    .eq("household_id", household!.id)
    .order("is_cooking", { ascending: false })
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <NewMealPlanForm recipes={recipes ?? []} />;
}

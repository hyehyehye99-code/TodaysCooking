import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { NewMealPlanForm } from "./new-meal-plan-form";

export default async function NewMealPlanPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, cover_photo_urls, icon_emoji, bookmarks(thumbnail_url)")
    .eq("household_id", household!.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <NewMealPlanForm recipes={recipes ?? []} />;
}

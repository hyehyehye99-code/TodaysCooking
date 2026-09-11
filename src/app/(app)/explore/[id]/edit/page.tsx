import { notFound } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { EditMealPlanForm } from "./edit-meal-plan-form";

type MealPlanRecipeRow = { recipe_id: string };

export default async function EditMealPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [{ data: mealPlan }, { data: mealPlanRecipes }, { data: recipes }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("id, title, icon_emoji, event_date, headcount")
      .eq("id", id)
      .eq("household_id", household!.id)
      .maybeSingle(),
    supabase.from("meal_plan_recipes").select("recipe_id").eq("meal_plan_id", id).order("position"),
    supabase
      .from("recipes")
      .select("id, title, cover_photo_urls, icon_emoji, bookmarks(thumbnail_url)")
      .eq("household_id", household!.id)
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!mealPlan) notFound();

  const defaultSelected = ((mealPlanRecipes as MealPlanRecipeRow[] | null) ?? []).map((r) => r.recipe_id);

  return (
    <EditMealPlanForm
      mealPlanId={mealPlan.id}
      title={mealPlan.title}
      iconEmoji={mealPlan.icon_emoji}
      eventDateIso={mealPlan.event_date}
      headcount={mealPlan.headcount}
      recipes={recipes ?? []}
      defaultSelected={defaultSelected}
    />
  );
}

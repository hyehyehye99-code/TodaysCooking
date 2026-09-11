"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

function parseRecipeIds(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function replaceMealPlanRecipes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mealPlanId: string,
  recipeIds: string[]
) {
  await supabase.from("meal_plan_recipes").delete().eq("meal_plan_id", mealPlanId);
  if (recipeIds.length === 0) return;
  await supabase.from("meal_plan_recipes").insert(
    recipeIds.map((recipeId, i) => ({ meal_plan_id: mealPlanId, recipe_id: recipeId, position: i }))
  );
}

export async function createMealPlan(_prevState: unknown, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim();
  const recipeIds = parseRecipeIds(String(formData.get("recipeIds") ?? ""));
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  if (!title) return { error: "메뉴판 이름을 입력해주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();
  const { data: mealPlan, error } = await supabase
    .from("meal_plans")
    .insert({
      household_id: household.id,
      title,
      icon_emoji: iconEmoji || null,
      event_date: eventDateRaw ? new Date(eventDateRaw).toISOString() : null,
      headcount: headcountRaw ? Number(headcountRaw) : null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !mealPlan) return { error: "메뉴판을 만들지 못했어요." };

  await replaceMealPlanRecipes(supabase, mealPlan.id, recipeIds);

  revalidatePath("/explore");
  redirect(`/explore/${mealPlan.id}`);
}

export async function updateMealPlan(_prevState: unknown, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim();
  const recipeIds = parseRecipeIds(String(formData.get("recipeIds") ?? ""));
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  if (!id) return { error: "메뉴판을 찾지 못했어요." };
  if (!title) return { error: "메뉴판 이름을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_plans")
    .update({
      title,
      icon_emoji: iconEmoji || null,
      event_date: eventDateRaw ? new Date(eventDateRaw).toISOString() : null,
      headcount: headcountRaw ? Number(headcountRaw) : null,
    })
    .eq("id", id);
  if (error) return { error: "메뉴판을 수정하지 못했어요." };

  await replaceMealPlanRecipes(supabase, id, recipeIds);

  revalidatePath("/explore");
  revalidatePath(`/explore/${id}`);
  redirect(`/explore/${id}`);
}

// Toggling a single recipe in/out of a meal plan from the recipe's own
// detail page — the alternative to building a whole plan at once via the
// picker in new-meal-plan-form.tsx, for when it's easier to just add
// recipes to a plan one at a time while browsing them normally.
export async function toggleRecipeInMealPlan(mealPlanId: string, recipeId: string, next: boolean) {
  const supabase = await createClient();
  if (next) {
    const { count } = await supabase
      .from("meal_plan_recipes")
      .select("*", { count: "exact", head: true })
      .eq("meal_plan_id", mealPlanId);
    await supabase
      .from("meal_plan_recipes")
      .upsert(
        { meal_plan_id: mealPlanId, recipe_id: recipeId, position: count ?? 0 },
        { onConflict: "meal_plan_id,recipe_id" }
      );
  } else {
    await supabase.from("meal_plan_recipes").delete().eq("meal_plan_id", mealPlanId).eq("recipe_id", recipeId);
  }
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/explore/${mealPlanId}`);
  revalidatePath("/explore");
}

export async function deleteMealPlan(id: string) {
  const supabase = await createClient();
  await supabase.from("meal_plans").delete().eq("id", id);
  revalidatePath("/explore");
  redirect("/explore");
}

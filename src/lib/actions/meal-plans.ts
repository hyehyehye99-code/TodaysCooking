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
  const recipeIds = parseRecipeIds(String(formData.get("recipeIds") ?? ""));
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  if (!title) return { error: "메뉴판 이름을 입력해주세요." };
  if (recipeIds.length === 0) return { error: "레시피를 1개 이상 골라주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();
  const { data: mealPlan, error } = await supabase
    .from("meal_plans")
    .insert({
      household_id: household.id,
      title,
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
  const recipeIds = parseRecipeIds(String(formData.get("recipeIds") ?? ""));
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  if (!id) return { error: "메뉴판을 찾지 못했어요." };
  if (!title) return { error: "메뉴판 이름을 입력해주세요." };
  if (recipeIds.length === 0) return { error: "레시피를 1개 이상 골라주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_plans")
    .update({
      title,
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

// Renames how one recipe shows up within this meal plan only — the actual
// recipe's own title is untouched.
export async function setMealPlanRecipeDisplayName(
  mealPlanId: string,
  recipeId: string,
  displayName: string | null
) {
  const supabase = await createClient();
  await supabase
    .from("meal_plan_recipes")
    .update({ display_name: displayName })
    .eq("meal_plan_id", mealPlanId)
    .eq("recipe_id", recipeId);
  revalidatePath(`/explore/${mealPlanId}`);
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

// Quick-create a meal plan seeded with just this one recipe — the inline
// "+ 새 메뉴판" option in AddToMealPlanButton, so starting a plan doesn't
// require leaving the recipe you're already looking at.
export async function createMealPlanWithRecipe(
  title: string,
  recipeId: string
): Promise<{ error: string } | { ok: true; id: string }> {
  const trimmed = title.trim();
  if (!trimmed) return { error: "메뉴판 이름을 입력해주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();
  const { data: mealPlan, error } = await supabase
    .from("meal_plans")
    .insert({ household_id: household.id, title: trimmed, created_by: user.id })
    .select("id")
    .single();
  if (error || !mealPlan) return { error: "메뉴판을 만들지 못했어요." };

  await supabase.from("meal_plan_recipes").insert({ meal_plan_id: mealPlan.id, recipe_id: recipeId, position: 0 });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/explore");
  return { ok: true, id: mealPlan.id };
}

// The info box's inline date/headcount fields — both optional and
// display-only (headcount is just shown, never used to scale any recipe's
// ingredient amounts).
// Hides (or restores) a meal plan without deleting it — managed from the
// carousel's "메뉴판 목록" sheet, not from the per-plan "⋮" menu, since
// this is about which plans show up in the swipeable set, not the plan's
// own content.
export async function setMealPlanHidden(id: string, hidden: boolean) {
  const supabase = await createClient();
  await supabase.from("meal_plans").update({ hidden }).eq("id", id);
  revalidatePath("/explore");
}

export async function deleteMealPlan(id: string) {
  const supabase = await createClient();
  await supabase.from("meal_plans").delete().eq("id", id);
  revalidatePath("/explore");
  redirect("/explore");
}

// Bulk version of recipes.ts's resolveMissingIngredients, scoped to just the
// "add to shopping list" half — a meal plan's whole point is collapsing
// several recipes' missing ingredients into one action instead of visiting
// each recipe separately, so there's no per-item skip/fridge modal here,
// just "add everything currently missing".
export async function addMealPlanIngredientsToShopping(mealPlanId: string, names: string[]) {
  if (names.length === 0) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  const [{ data: mealPlan }, { data: existing }] = await Promise.all([
    supabase.from("meal_plans").select("title").eq("id", mealPlanId).single(),
    supabase.from("shopping_items").select("id, name, source_recipe_title").eq("household_id", household.id),
  ]);
  const planTitle = mealPlan?.title ?? null;
  const existingByName = new Map((existing ?? []).map((i) => [i.name, i]));

  const toInsert = names.filter((name) => !existingByName.has(name));
  const toUpdate = planTitle
    ? names
        .map((name) => existingByName.get(name))
        .filter((item): item is NonNullable<typeof item> => !!item)
        .map((item) => {
          const titles = (item.source_recipe_title ?? "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean);
          if (titles.includes(planTitle)) return null;
          return { id: item.id, source_recipe_title: [...titles, planTitle].join(", ") };
        })
        .filter((u): u is { id: string; source_recipe_title: string } => !!u)
    : [];

  if (toInsert.length) {
    await supabase.from("shopping_items").insert(
      toInsert.map((name) => ({
        household_id: household.id,
        name,
        source_recipe_title: planTitle,
      }))
    );
  }
  if (toUpdate.length) {
    await supabase.from("shopping_items").upsert(
      toUpdate.map((u) => ({ id: u.id, household_id: household.id, source_recipe_title: u.source_recipe_title }))
    );
  }

  revalidatePath(`/explore/${mealPlanId}`);
  revalidatePath("/shopping");
}

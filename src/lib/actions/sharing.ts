"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function ensureRecipeShareCode(
  recipeId: string
): Promise<{ ok: true; shareCode: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ensure_recipe_share_code", {
    target_recipe_id: recipeId,
  });
  if (error || !data) return { ok: false, error: "공유 링크를 만들지 못했어요." };
  return { ok: true, shareCode: data as string };
}

type SharedRecipeIngredient = { name: string; amount: string | null; skipped: boolean };

type SharedRecipeSource = {
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  ingredients: SharedRecipeIngredient[];
};

// Copies a recipe someone shared via /share/recipe/[code] into the caller's
// own household as a brand new recipe — a one-time fork, same pattern as
// Explore's addExploreRecipeToHousehold, just sourced from a share link
// instead of a public listing.
export async function addSharedRecipeToHousehold(shareCode: string) {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "로그인 후 이용해주세요." };

  const supabase = await createClient();

  const { data, error } = (await supabase
    .rpc("get_shared_recipe", { p_share_code: shareCode })
    .maybeSingle()) as { data: SharedRecipeSource | null; error: unknown };
  if (error || !data) return { error: "레시피를 불러오지 못했어요." };

  const { data: topRecipe } = await supabase
    .from("recipes")
    .select("position")
    .eq("household_id", household.id)
    .order("position", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const newPosition = (topRecipe?.position ?? 0) - 1;

  const { data: recipe, error: insertError } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      title: data.title,
      subtitle: data.subtitle,
      cover_photo_urls: data.cover_photo_urls,
      icon_emoji: data.icon_emoji,
      tags: data.tags,
      notes: data.notes,
      created_by: user.id,
      position: newPosition,
    })
    .select("id")
    .single();
  if (insertError || !recipe) return { error: "레시피를 추가하지 못했어요." };

  const ingredients = data.ingredients ?? [];
  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({
        recipe_id: recipe.id,
        name: ing.name,
        amount: ing.amount,
        skipped: ing.skipped,
        position: i,
      }))
    );
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function reactToRecipe(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("recipe_reactions")
    .insert({ recipe_id: recipeId, user_id: user?.id ?? null });
  // 23505 = unique_violation — a double-click landed two inserts for the
  // same (recipe, user); the row is already there, which is the goal.
  if (error && error.code !== "23505") return { error: "표현하지 못했어요." };
  return { success: true as const };
}

export async function unreactToRecipe(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  await supabase.from("recipe_reactions").delete().eq("recipe_id", recipeId).eq("user_id", user.id);
  return { success: true as const };
}

export async function clearRecipeReactions(recipeId: string) {
  const supabase = await createClient();
  await supabase.from("recipe_reactions").delete().eq("recipe_id", recipeId);
  revalidatePath(`/recipes/${recipeId}`);
}

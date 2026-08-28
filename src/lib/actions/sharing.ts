"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

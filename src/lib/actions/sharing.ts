"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setHouseholdSharing(
  householdId: string,
  enabled: boolean
): Promise<{ ok: true; shareCode: string | null } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_household_share_enabled", {
    target_household_id: householdId,
    enabled,
  });
  if (error) return { ok: false, error: "공유 설정을 변경하지 못했어요." };

  revalidatePath("/mypage");
  return { ok: true, shareCode: (data as string | null) ?? null };
}

export async function setHouseholdShareTags(
  householdId: string,
  tags: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_household_share_tags", {
    target_household_id: householdId,
    new_tags: tags,
  });
  if (error) return { ok: false, error: "공유 범위를 저장하지 못했어요." };

  revalidatePath("/mypage");
  return { ok: true };
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

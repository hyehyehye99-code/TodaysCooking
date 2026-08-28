"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminCredentials, setAdminSession, clearAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function adminLoginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkAdminCredentials(username, password)) {
    return { error: "아이디 또는 비밀번호가 올바르지 않아요." };
  }
  await setAdminSession();
  redirect("/admin/creators");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createCreator(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "크리에이터 이름을 입력해주세요." };
  const channelType = String(formData.get("channelType") ?? "").trim() || null;
  const channelName = String(formData.get("channelName") ?? "").trim() || null;
  const channelLink = String(formData.get("channelLink") ?? "").trim() || null;
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .insert({
      name,
      channel_type: channelType,
      channel_name: channelName,
      channel_link: channelLink,
      icon_emoji: iconEmoji,
      tags,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "크리에이터 추가에 실패했어요." };

  revalidatePath("/admin/creators");
  redirect(`/admin/creators/${data.id}`);
}

export type CreatorRecipeInput = {
  creatorId: string;
  title: string;
  subtitle: string;
  iconEmoji: string;
  coverPhotoUrl: string;
  tags: string[];
  notes: string;
  ingredients: { name: string; amount: string }[];
};

export async function createCreatorRecipe(
  input: CreatorRecipeInput
): Promise<{ error: string } | { ok: true; id: string }> {
  await requireAdmin();

  const title = input.title.trim();
  if (!title) return { error: "요리 이름을 입력해주세요." };

  const supabase = createAdminClient();
  const { data: recipe, error } = await supabase
    .from("creator_recipes")
    .insert({
      creator_id: input.creatorId,
      title,
      subtitle: input.subtitle.trim() || null,
      icon_emoji: input.iconEmoji || null,
      cover_photo_urls: input.coverPhotoUrl.trim() ? [input.coverPhotoUrl.trim()] : [],
      tags: input.tags,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();
  if (error || !recipe) return { error: "레시피 추가에 실패했어요." };

  const ingredients = input.ingredients
    .map((i) => ({ name: i.name.trim(), amount: i.amount.trim() }))
    .filter((i) => i.name);
  if (ingredients.length > 0) {
    await supabase.from("creator_recipe_ingredients").insert(
      ingredients.map((ing, i) => ({
        creator_recipe_id: recipe.id,
        name: ing.name,
        amount: ing.amount,
        position: i,
      }))
    );
  }

  revalidatePath(`/admin/creators/${input.creatorId}`);
  return { ok: true, id: recipe.id };
}

export async function deleteCreatorRecipe(creatorId: string, recipeId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("creator_recipes").delete().eq("id", recipeId);
  revalidatePath(`/admin/creators/${creatorId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
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

export async function updateCreatorRecipe(
  input: CreatorRecipeInput & { recipeId: string }
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();

  const title = input.title.trim();
  if (!title) return { error: "요리 이름을 입력해주세요." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("creator_recipes")
    .update({
      title,
      subtitle: input.subtitle.trim() || null,
      icon_emoji: input.iconEmoji || null,
      cover_photo_urls: input.coverPhotoUrl.trim() ? [input.coverPhotoUrl.trim()] : [],
      tags: input.tags,
      notes: input.notes.trim() || null,
    })
    .eq("id", input.recipeId);
  if (error) return { error: "레시피 수정에 실패했어요." };

  // Simplest correct way to keep ingredient order/content in sync with the
  // form's list: replace the whole set rather than diffing row by row.
  await supabase.from("creator_recipe_ingredients").delete().eq("creator_recipe_id", input.recipeId);
  const ingredients = input.ingredients
    .map((i) => ({ name: i.name.trim(), amount: i.amount.trim() }))
    .filter((i) => i.name);
  if (ingredients.length > 0) {
    await supabase.from("creator_recipe_ingredients").insert(
      ingredients.map((ing, i) => ({
        creator_recipe_id: input.recipeId,
        name: ing.name,
        amount: ing.amount,
        position: i,
      }))
    );
  }

  revalidatePath(`/admin/creators/${input.creatorId}`);
  return { ok: true };
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Ingredients within one Excel cell, one per line, "이름:용량" (amount
// optional) — matches how the template/instructions describe the format,
// since a cell can't hold the form's separate name/amount inputs directly.
function parseIngredientsCell(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      if (i === -1) return { name: line, amount: "" };
      return { name: line.slice(0, i).trim(), amount: line.slice(i + 1).trim() };
    })
    .filter((ing) => ing.name);
}

const IMPORT_HEADERS = {
  creatorName: "크리에이터이름",
  channelType: "채널종류",
  channelName: "채널이름",
  channelLink: "채널링크",
  creatorTags: "크리에이터태그",
  title: "레시피제목",
  subtitle: "한줄소개",
  ingredients: "재료",
  notes: "만드는법",
  tags: "레시피태그",
  coverPhotoUrl: "커버사진URL",
  iconEmoji: "아이콘이모지",
} as const;

export async function importCreatorRecipesFromExcel(formData: FormData): Promise<
  | { error: string }
  | { ok: true; creatorsCreated: number; recipesCreated: number; errors: string[] }
> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일을 선택해주세요." };

  let rows: Record<string, unknown>[];
  try {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { error: "엑셀 파일을 읽지 못했어요. 템플릿 형식을 확인해주세요." };
  }
  if (rows.length === 0) return { error: "입력된 행이 없어요." };

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("creators").select("id, name");
  const creatorIdByName = new Map((existing ?? []).map((c) => [c.name, c.id as string]));

  let creatorsCreated = 0;
  let recipesCreated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNum = i + 2; // row 1 is the header
    const get = (key: keyof typeof IMPORT_HEADERS) => String(raw[IMPORT_HEADERS[key]] ?? "").trim();

    const creatorName = get("creatorName");
    const title = get("title");
    if (!creatorName) {
      errors.push(`${rowNum}행: 크리에이터이름이 비어있어요.`);
      continue;
    }
    if (!title) {
      errors.push(`${rowNum}행: 레시피제목이 비어있어요.`);
      continue;
    }

    let creatorId = creatorIdByName.get(creatorName);
    if (!creatorId) {
      const { data: newCreator, error } = await supabase
        .from("creators")
        .insert({
          name: creatorName,
          channel_type: get("channelType") || null,
          channel_name: get("channelName") || null,
          channel_link: get("channelLink") || null,
          tags: splitTags(get("creatorTags")),
        })
        .select("id")
        .single();
      if (error || !newCreator) {
        errors.push(`${rowNum}행: 크리에이터 "${creatorName}" 생성에 실패했어요.`);
        continue;
      }
      creatorId = newCreator.id as string;
      creatorIdByName.set(creatorName, creatorId);
      creatorsCreated++;
    }

    const coverPhotoUrl = get("coverPhotoUrl");
    const { data: recipe, error: recipeError } = await supabase
      .from("creator_recipes")
      .insert({
        creator_id: creatorId,
        title,
        subtitle: get("subtitle") || null,
        icon_emoji: get("iconEmoji") || null,
        cover_photo_urls: coverPhotoUrl ? [coverPhotoUrl] : [],
        tags: splitTags(get("tags")),
        notes: get("notes") || null,
      })
      .select("id")
      .single();
    if (recipeError || !recipe) {
      errors.push(`${rowNum}행 (${title}): 레시피 추가에 실패했어요.`);
      continue;
    }

    const ingredients = parseIngredientsCell(get("ingredients"));
    if (ingredients.length > 0) {
      await supabase.from("creator_recipe_ingredients").insert(
        ingredients.map((ing, idx) => ({
          creator_recipe_id: recipe.id,
          name: ing.name,
          amount: ing.amount,
          position: idx,
        }))
      );
    }
    recipesCreated++;
  }

  revalidatePath("/admin/creators");
  return { ok: true, creatorsCreated, recipesCreated, errors };
}

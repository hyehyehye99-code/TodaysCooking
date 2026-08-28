"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminCredentials, setAdminSession, clearAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { adminGenerateRecipeFromLink } from "@/lib/actions/ai-recipe";

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
  link: "링크",
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
    if (!creatorName) {
      errors.push(`${rowNum}행: 크리에이터이름이 비어있어요.`);
      continue;
    }

    let title = get("title");
    const link = get("link");

    // No title and no link: nothing to make a recipe out of. If it's also
    // the only thing in the row, treat it as "just register this creator"
    // rather than an error — that's the whole point of a creator-only row.
    if (!title && !link) {
      if (!creatorIdByName.has(creatorName)) {
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
        creatorIdByName.set(creatorName, newCreator.id as string);
        creatorsCreated++;
      }
      continue;
    }

    let subtitle = get("subtitle");
    let notes = get("notes");
    let tags = splitTags(get("tags"));
    let coverPhotoUrl = get("coverPhotoUrl");
    let ingredients = parseIngredientsCell(get("ingredients"));

    // A link plus any of title/ingredients/notes still blank means AI
    // should fill the gaps — explicit cells always win over the AI result.
    if (link && (!title || ingredients.length === 0 || !notes)) {
      const ai = await adminGenerateRecipeFromLink(link);
      if (ai.ok) {
        title = title || ai.title || "";
        subtitle = subtitle || ai.subtitle || "";
        notes = notes || ai.instructions;
        if (ingredients.length === 0) ingredients = ai.ingredients;
        if (tags.length === 0) tags = ai.tags;
        if (!coverPhotoUrl && ai.thumbnailUrl) coverPhotoUrl = ai.thumbnailUrl;
      } else if (!title) {
        errors.push(`${rowNum}행: 링크에서 자동으로 채우지 못했어요 (${ai.error}).`);
        continue;
      } else {
        errors.push(`${rowNum}행 (${title}): 링크 자동 채우기는 실패해서 입력된 내용만으로 등록했어요.`);
      }
    }

    if (!title) {
      errors.push(`${rowNum}행: 레시피제목이나 링크 중 하나는 필요해요.`);
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

    const { data: recipe, error: recipeError } = await supabase
      .from("creator_recipes")
      .insert({
        creator_id: creatorId,
        title,
        subtitle: subtitle || null,
        icon_emoji: get("iconEmoji") || null,
        cover_photo_urls: coverPhotoUrl ? [coverPhotoUrl] : [],
        tags,
        notes: notes || null,
      })
      .select("id")
      .single();
    if (recipeError || !recipe) {
      errors.push(`${rowNum}행 (${title}): 레시피 추가에 실패했어요.`);
      continue;
    }

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

export async function approveCreatorApplication(
  applicationId: string
): Promise<{ error: string } | { ok: true; creatorId: string }> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: application, error: fetchError } = await supabase
    .from("creator_applications")
    .select("id, creator_name, channel_type, channel_name, channel_link, tags, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (fetchError || !application) return { error: "지원서를 찾지 못했어요." };
  if (application.status !== "pending") return { error: "이미 처리된 지원서예요." };

  // Same dedup-by-name as the Excel import: if a creator with this exact
  // name was already registered (e.g. by hand before the application was
  // reviewed), reuse it instead of creating a duplicate.
  const { data: existing } = await supabase
    .from("creators")
    .select("id")
    .eq("name", application.creator_name)
    .maybeSingle();

  let creatorId = existing?.id as string | undefined;
  if (!creatorId) {
    const { data: newCreator, error: createError } = await supabase
      .from("creators")
      .insert({
        name: application.creator_name,
        channel_type: application.channel_type,
        channel_name: application.channel_name,
        channel_link: application.channel_link,
        tags: application.tags,
      })
      .select("id")
      .single();
    if (createError || !newCreator) return { error: "크리에이터 등록에 실패했어요." };
    creatorId = newCreator.id as string;
  }

  const { error: updateError } = await supabase
    .from("creator_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);
  if (updateError) return { error: "지원서 상태 변경에 실패했어요." };

  revalidatePath("/admin/applications");
  revalidatePath("/admin/creators");
  return { ok: true, creatorId };
}

export async function rejectCreatorApplication(applicationId: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("creator_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId)
    .eq("status", "pending");
  if (error) return { error: "처리에 실패했어요." };

  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function resolveInquiry(
  inquiryId: string,
  adminNote: string
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status: "resolved", admin_note: adminNote.trim() || null, resolved_at: new Date().toISOString() })
    .eq("id", inquiryId);
  if (error) return { error: "처리에 실패했어요." };

  revalidatePath("/admin/inquiries");
  return { ok: true };
}

export async function reopenInquiry(inquiryId: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status: "open", resolved_at: null })
    .eq("id", inquiryId);
  if (error) return { error: "처리에 실패했어요." };

  revalidatePath("/admin/inquiries");
  return { ok: true };
}

// Per the ai_recipe_reports migration's own documented workflow: a bad AI
// result is "fixed" by deleting the matching ai_recipe_generations row,
// which refunds the reporter's weekly/monthly quota count. Dismissing
// without a refund just removes the report (e.g. the result was actually
// fine). Either way the report itself is cleared once handled — there's no
// separate "resolved" flag to track, the row's absence is the record.
export async function resolveAiReport(
  reportId: string,
  generationId: string,
  refund: boolean
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const supabase = createAdminClient();

  if (refund) {
    await supabase.from("ai_recipe_generations").delete().eq("id", generationId);
  }
  const { error } = await supabase.from("ai_recipe_reports").delete().eq("id", reportId);
  if (error) return { error: "처리에 실패했어요." };

  revalidatePath("/admin/ai-reports");
  return { ok: true };
}

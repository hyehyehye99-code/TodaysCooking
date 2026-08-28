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
  const channelLink = String(formData.get("channelLink") ?? "").trim() || null;
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim() || null;
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creators")
    .insert({
      name,
      channel_type: channelType,
      channel_link: channelLink,
      icon_emoji: iconEmoji,
      avatar_url: avatarUrl,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "크리에이터 추가에 실패했어요." };

  revalidatePath("/admin/creators");
  redirect(`/admin/creators/${data.id}`);
}

export async function updateCreator(
  creatorId: string,
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "크리에이터 이름을 입력해주세요." };
  const channelType = String(formData.get("channelType") ?? "").trim() || null;
  const channelLink = String(formData.get("channelLink") ?? "").trim() || null;
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim() || null;
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("creators")
    .update({
      name,
      channel_type: channelType,
      channel_link: channelLink,
      icon_emoji: iconEmoji,
      avatar_url: avatarUrl,
    })
    .eq("id", creatorId);
  if (error) return { error: "크리에이터 수정에 실패했어요." };

  revalidatePath(`/admin/creators/${creatorId}`);
  revalidatePath("/admin/creators");
  redirect(`/admin/creators/${creatorId}`);
}

export async function deleteCreator(creatorId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("creators").delete().eq("id", creatorId);
  revalidatePath("/admin/creators");
  redirect("/admin/creators");
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
  // The link a recipe was generated from (AI 자동 작성 URL, or a channel
  // video picked from the bulk importer) — recorded so the channel-video
  // picker can tell a video already has a recipe and skip it next time.
  sourceUrl?: string;
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
      source_url: input.sourceUrl?.trim() || null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return { error: "이미 이 링크로 추가된 레시피가 있어요." };
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
      source_url: input.sourceUrl?.trim() || null,
    })
    .eq("id", input.recipeId);
  if (error?.code === "23505") return { error: "이미 이 링크로 추가된 레시피가 있어요." };
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
  channelLink: "채널링크",
  title: "레시피제목",
  link: "링크",
  subtitle: "한줄소개",
  ingredients: "재료",
  notes: "만드는법",
  tags: "레시피태그",
  coverPhotoUrl: "커버사진URL",
  iconEmoji: "아이콘이모지",
} as const;

export type ImportPreviewRow = {
  creatorName: string;
  channelType: string;
  channelLink: string;
  title: string;
  link: string;
  subtitle: string;
  ingredients: string;
  notes: string;
  tags: string;
  coverPhotoUrl: string;
  iconEmoji: string;
};

// Step 1 of the import flow: just read the file into a reviewable table —
// no DB writes, no AI calls yet. The admin reviews it, optionally runs
// "AI 생성" (client-side, row by row, via adminGenerateRecipeFromLink) to
// fill in rows that only have a link, then calls commitImportRows below
// once they're happy with what's about to be created.
export async function parseExcelForPreview(
  formData: FormData
): Promise<{ error: string } | { ok: true; rows: ImportPreviewRow[] }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일을 선택해주세요." };

  let raw: Record<string, unknown>[];
  try {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { error: "엑셀 파일을 읽지 못했어요. 템플릿 형식을 확인해주세요." };
  }
  if (raw.length === 0) return { error: "입력된 행이 없어요." };

  const rows: ImportPreviewRow[] = raw.map((r) => {
    const get = (key: keyof typeof IMPORT_HEADERS) => String(r[IMPORT_HEADERS[key]] ?? "").trim();
    return {
      creatorName: get("creatorName"),
      channelType: get("channelType"),
      channelLink: get("channelLink"),
      title: get("title"),
      link: get("link"),
      subtitle: get("subtitle"),
      ingredients: get("ingredients"),
      notes: get("notes"),
      tags: get("tags"),
      coverPhotoUrl: get("coverPhotoUrl"),
      iconEmoji: get("iconEmoji"),
    };
  });
  return { ok: true, rows };
}

// Step 2: the reviewed (and possibly AI-filled) rows actually get written.
export async function commitImportRows(rows: ImportPreviewRow[]): Promise<
  | { error: string }
  | { ok: true; creatorsCreated: number; recipesCreated: number; errors: string[] }
> {
  await requireAdmin();
  if (rows.length === 0) return { error: "등록할 행이 없어요." };

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("creators").select("id, name");
  const creatorIdByName = new Map((existing ?? []).map((c) => [c.name, c.id as string]));

  let creatorsCreated = 0;
  let recipesCreated = 0;
  const errors: string[] = [];

  async function ensureCreator(row: ImportPreviewRow, creatorName: string): Promise<string | null> {
    const cached = creatorIdByName.get(creatorName);
    if (cached) return cached;
    const { data: newCreator, error } = await supabase
      .from("creators")
      .insert({
        name: creatorName,
        channel_type: row.channelType.trim() || null,
        channel_link: row.channelLink.trim() || null,
      })
      .select("id")
      .single();
    if (error || !newCreator) return null;
    creatorIdByName.set(creatorName, newCreator.id as string);
    creatorsCreated++;
    return newCreator.id as string;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const creatorName = row.creatorName.trim();
    if (!creatorName) {
      errors.push(`${rowNum}번째 행: 크리에이터이름이 비어있어요.`);
      continue;
    }

    const title = row.title.trim();

    // No title and no link: nothing to make a recipe out of. If it's also
    // the only thing in the row, treat it as "just register this creator"
    // rather than an error — that's the whole point of a creator-only row.
    if (!title && !row.link.trim()) {
      if (!(await ensureCreator(row, creatorName))) {
        errors.push(`${rowNum}번째 행: 크리에이터 "${creatorName}" 생성에 실패했어요.`);
      }
      continue;
    }

    if (!title) {
      errors.push(`${rowNum}번째 행: 레시피제목이 비어있어요. AI 생성을 먼저 실행해주세요.`);
      continue;
    }

    const creatorId = await ensureCreator(row, creatorName);
    if (!creatorId) {
      errors.push(`${rowNum}번째 행: 크리에이터 "${creatorName}" 생성에 실패했어요.`);
      continue;
    }

    const coverPhotoUrl = row.coverPhotoUrl.trim();
    const { data: recipe, error: recipeError } = await supabase
      .from("creator_recipes")
      .insert({
        creator_id: creatorId,
        title,
        subtitle: row.subtitle.trim() || null,
        icon_emoji: row.iconEmoji.trim() || null,
        cover_photo_urls: coverPhotoUrl ? [coverPhotoUrl] : [],
        tags: splitTags(row.tags),
        notes: row.notes.trim() || null,
      })
      .select("id")
      .single();
    if (recipeError || !recipe) {
      errors.push(`${rowNum}번째 행 (${title}): 레시피 추가에 실패했어요.`);
      continue;
    }

    const ingredients = parseIngredientsCell(row.ingredients);
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
  revalidatePath("/admin/creator-recipes");
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

export async function createExpense(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();

  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw);
  const spentAt = String(formData.get("spentAt") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!category) return { error: "카테고리를 입력해주세요." };
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) return { error: "금액을 올바르게 입력해주세요." };
  if (!spentAt) return { error: "날짜를 선택해주세요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("expenses").insert({
    category,
    amount,
    spent_at: spentAt,
    memo: memo || null,
  });
  if (error) return { error: "지출 등록에 실패했어요." };

  revalidatePath("/admin/expenses");
  return null;
}

export async function deleteExpense(expenseId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("expenses").delete().eq("id", expenseId);
  revalidatePath("/admin/expenses");
}

export async function createPromoCode(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "코드를 입력해주세요." };
  const note = String(formData.get("note") ?? "").trim() || null;
  const durationRaw = String(formData.get("durationDays") ?? "").trim();
  const durationDays = durationRaw ? Number(durationRaw) : null;
  if (durationRaw && (Number.isNaN(durationDays) || (durationDays as number) <= 0)) {
    return { error: "기간은 양의 숫자로 입력해주세요." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").insert({
    code,
    note,
    duration_days: durationDays,
  });
  if (error) return { error: error.code === "23505" ? "이미 있는 코드예요." : "코드 생성에 실패했어요." };

  revalidatePath("/admin/promotions");
  return null;
}

export async function togglePromoCodeActive(code: string, active: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("promo_codes").update({ active }).eq("code", code);
  revalidatePath("/admin/promotions");
}

export async function deletePromoCode(code: string): Promise<{ error: string } | null> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").delete().eq("code", code);
  if (error) return { error: "이미 지급된 코드는 삭제할 수 없어요. 비활성화해주세요." };
  revalidatePath("/admin/promotions");
  return null;
}

export async function grantPromoToUser(
  userId: string,
  code: string
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  if (!userId) return { error: "유저를 선택해주세요." };
  if (!code) return { error: "프로모션 코드를 선택해주세요." };

  const supabase = createAdminClient();
  const { data: promo } = await supabase
    .from("promo_codes")
    .select("code, duration_days, active")
    .eq("code", code)
    .maybeSingle();
  if (!promo) return { error: "존재하지 않는 코드예요." };
  if (!promo.active) return { error: "비활성화된 코드예요." };

  const expiresAt = promo.duration_days
    ? new Date(Date.now() + promo.duration_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from("promo_code_redemptions").upsert(
    {
      user_id: userId,
      code: promo.code,
      expires_at: expiresAt,
      granted_by: "admin",
      redeemed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: "지급에 실패했어요." };

  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function revokePromoRedemption(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("promo_code_redemptions").delete().eq("user_id", userId);
  revalidatePath("/admin/promotions");
}

export async function createRecurringExpense(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();

  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw);
  const cycle = String(formData.get("cycle") ?? "monthly").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!category) return { error: "카테고리를 입력해주세요." };
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) return { error: "금액을 올바르게 입력해주세요." };
  if (cycle !== "monthly" && cycle !== "yearly") return { error: "주기를 선택해주세요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("recurring_expenses").insert({
    category,
    amount,
    cycle,
    memo: memo || null,
  });
  if (error) return { error: "정기 지출 등록에 실패했어요." };

  revalidatePath("/admin/expenses");
  return null;
}

export async function toggleRecurringExpenseActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("recurring_expenses").update({ active }).eq("id", id);
  revalidatePath("/admin/expenses");
}

export async function deleteRecurringExpense(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("recurring_expenses").delete().eq("id", id);
  revalidatePath("/admin/expenses");
}

export async function logRecurringExpenseOccurrence(id: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: recurring } = await supabase
    .from("recurring_expenses")
    .select("category, amount, memo, cycle")
    .eq("id", id)
    .maybeSingle();
  if (!recurring) return { error: "정기 지출 항목을 찾을 수 없어요." };

  const now = new Date();
  const periodStart =
    recurring.cycle === "yearly"
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);

  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("recurring_expense_id", id)
    .gte("spent_at", periodStart.toISOString().slice(0, 10));
  if (count && count > 0) return { error: "이번 주기에 이미 기록했어요." };

  const { error } = await supabase.from("expenses").insert({
    category: recurring.category,
    amount: recurring.amount,
    memo: recurring.memo,
    spent_at: now.toISOString().slice(0, 10),
    recurring_expense_id: id,
  });
  if (error) return { error: "기록에 실패했어요." };

  revalidatePath("/admin/expenses");
  return { ok: true };
}

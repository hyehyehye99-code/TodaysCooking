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
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
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
  const grantCountRaw = String(formData.get("grantCount") ?? "").trim();
  const grantCount = Number(grantCountRaw);
  if (!grantCountRaw || Number.isNaN(grantCount) || grantCount <= 0) {
    return { error: "지급 횟수는 양의 숫자로 입력해주세요." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").insert({
    code,
    note,
    grant_count: grantCount,
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
    .select("code, grant_count, active")
    .eq("code", code)
    .maybeSingle();
  if (!promo) return { error: "존재하지 않는 코드예요." };
  if (!promo.active) return { error: "비활성화된 코드예요." };

  const { error } = await supabase.from("promo_code_redemptions").upsert(
    {
      user_id: userId,
      code: promo.code,
      remaining_count: promo.grant_count,
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

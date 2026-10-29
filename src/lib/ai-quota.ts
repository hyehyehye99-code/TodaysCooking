import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Resets weekly so a bad week doesn't lock someone out for a month. Flash-tier
// Gemini pricing keeps a single generation's cost well under a cent, so this
// is sized for a generous free experience rather than a tight cost cap —
// revisit against actual Google AI Studio billing if usage patterns change.
// Link imports and AI-assistant chats draw from this same pool.
export const FREE_WEEKLY_LIMIT = 20;

// Comma-separated emails (e.g. in .env.local) that skip the cap entirely —
// for the developer's own test account.
const UNLIMITED_EMAILS = new Set(
  (process.env.AI_RECIPE_UNLIMITED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export type AiQuota = {
  unlimited: boolean;
  // A promo grant is a finite top-up (see 마이페이지 어드민 > 프로모션 코드
  // 관리) drawn on before the weekly free quota, which stays frozen meanwhile.
  bonusRemaining: number;
  used: number;
  limit: number;
  // Share of the weekly free quota used, 0–100.
  percent: number;
  exhausted: boolean;
};

export const quotaPercent = (used: number, limit: number) =>
  Math.min(100, Math.round((used / limit) * 100));

export async function getAiQuota(supabase: Supabase, user: { id: string; email?: string }): Promise<AiQuota> {
  const unlimited = !!user.email && UNLIMITED_EMAILS.has(user.email.toLowerCase());

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: promoGrant }, { count }] = await Promise.all([
    supabase.from("promo_code_redemptions").select("remaining_count").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("ai_recipe_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("via_bonus", false)
      .gte("created_at", since),
  ]);

  const bonusRemaining = promoGrant?.remaining_count ?? 0;
  const used = Math.min(count ?? 0, FREE_WEEKLY_LIMIT);
  return {
    unlimited,
    bonusRemaining,
    used,
    limit: FREE_WEEKLY_LIMIT,
    percent: quotaPercent(used, FREE_WEEKLY_LIMIT),
    exhausted: !unlimited && bonusRemaining <= 0 && used >= FREE_WEEKLY_LIMIT,
  };
}

// Charged only after a successful generation, so a failed attempt never eats
// into the quota. The bonus spend is a conditional UPDATE (decrement_promo_bonus),
// not read-then-write, so concurrent requests can't both spend the same unit —
// via_bonus records whether that charge actually succeeded. The inserted row's
// id lets a user later report this exact generation (see reportAiRecipeResult).
export async function spendAiQuota(supabase: Supabase, userId: string, quota: AiQuota): Promise<string> {
  let charged = false;
  if (!quota.unlimited && quota.bonusRemaining > 0) {
    const { data: newCount } = await supabase.rpc("decrement_promo_bonus");
    charged = newCount !== null;
  }
  const { data } = await supabase
    .from("ai_recipe_generations")
    .insert({ user_id: userId, via_bonus: charged })
    .select("id")
    .single();
  return data?.id ?? "";
}

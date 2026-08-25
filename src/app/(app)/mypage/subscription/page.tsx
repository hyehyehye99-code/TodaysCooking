import { BackButton, GlassCard, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";

// Kept in sync with FREE_WEEKLY_LIMIT / PREMIUM_MONTHLY_LIMIT in
// src/lib/actions/ai-recipe.ts — this page only displays the count, the
// actual enforcement lives server-side in that action. Free and premium use
// different rolling windows (7 days vs 30), not just different caps.
const FREE_WEEKLY_LIMIT = 5;
const PREMIUM_MONTHLY_LIMIT = 100;

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: sub } = household
    ? await supabase
        .from("household_subscriptions")
        .select("active, expires_at")
        .eq("household_id", household.id)
        .maybeSingle()
    : { data: null };
  const isPremium = !!sub?.active && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  const limit = isPremium ? PREMIUM_MONTHLY_LIMIT : FREE_WEEKLY_LIMIT;
  const since = daysAgoIso(isPremium ? 30 : 7);

  const { count } = user
    ? await supabase
        .from("ai_recipe_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since)
    : { count: 0 };
  const used = Math.min(count ?? 0, limit);

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">구독</h1>
      </div>

      <GlassCard className="mb-6 bg-white p-4">
        <p className="text-sm font-semibold text-ink">
          {isPremium ? "프리미엄 이용 중" : "무료 플랜"}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {isPremium ? `이번 달 AI 자동 정리 ${used}/${limit}회 사용` : `이번 주 AI 자동 정리 ${used}/${limit}회 사용`}
        </p>
        <div className="mt-3">
          <ProgressBar percent={(used / limit) * 100} colorClass={isPremium ? "bg-accent" : "bg-positive"} />
        </div>
        {household && sub?.expires_at && isPremium && (
          <p className="mt-3 text-xs text-ink-faint">
            다음 결제일: {new Date(sub.expires_at).toLocaleDateString("ko-KR")}
          </p>
        )}
      </GlassCard>

      <SubscriptionPaywall isPremium={isPremium} householdId={household?.id ?? null} />
    </div>
  );
}

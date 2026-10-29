import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { getDictionary } from "@/lib/i18n/server";
import { GuestMyPage } from "./guest-mypage";
import { FeatureLinks } from "./feature-links";
import { Mascot } from "@/components/Mascot";
import { FREE_WEEKLY_LIMIT, quotaPercent } from "@/lib/ai-quota";

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export default async function MyPage() {
  const [{ user, household: current }, households, { dict }] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
    getDictionary(),
  ]);
  if (!user) return <GuestMyPage dict={dict} />;
  const supabase = await createClient();
  const planLimit = FREE_WEEKLY_LIMIT;
  const planSince = daysAgoIso(7);

  // None of these three depend on each other (only on user/households,
  // already resolved above) — they used to run one after another, adding
  // two full round trips to every mypage load for no reason.
  const [entries, { data: promoGrant }, { count: planUsageCount }] = await Promise.all([
    Promise.all(
      households.map(async ({ household, role }) => {
        const { data: members } = await supabase.rpc("get_household_members", {
          target_household_id: household.id,
        });
        return { household, role, members: (members as Member[] | null) ?? [] };
      })
    ),
    user
      ? supabase.from("promo_code_redemptions").select("remaining_count").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("ai_recipe_generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("via_bonus", false)
          .gte("created_at", planSince)
      : Promise.resolve({ count: 0 }),
  ]);

  const me = entries
    .find((e) => e.household.id === current?.id)
    ?.members.find((m) => m.user_id === user?.id);
  const myNickname = me?.nickname ?? "";
  const myIconEmoji = me?.icon_emoji ?? null;

  const bonusRemaining = promoGrant?.remaining_count ?? 0;
  const planUsed = Math.min(planUsageCount ?? 0, planLimit);
  const planPercent = quotaPercent(planUsed, planLimit);

  return (
    <div>
      <PageHeader title={dict.mypage.title} />

      <GlassCard className="mb-8 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} />

        <Link href="/mypage/usage" className="mt-4 block border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Mascot name="sparkle" size={34} />
            <p className="flex-1 text-sm font-bold text-ink">{dict.mypage.aiUsageLabel}</p>
            <p className="text-xs text-ink-soft">
              {bonusRemaining > 0
                ? dict.mypage.bonusRemainingTemplate.replace("{count}", String(bonusRemaining))
                : dict.mypage.usagePercentTemplate.replace("{percent}", String(planPercent))}
            </p>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
          {/* While a bonus grant is active every generation draws from it first
              (see ai-quota.ts) and the weekly count stays frozen, so the bar
              would read as "all used up" right when the opposite is true. */}
          {bonusRemaining === 0 && (
            <div className="mt-3">
              <ProgressBar percent={planPercent} colorClass={planPercent >= 80 ? "bg-accent" : "bg-ink"} />
            </div>
          )}
        </Link>
      </GlassCard>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink-soft">{dict.mypage.householdManagement}</p>
        <AddHouseholdSection />
      </div>
      <div className="mb-3">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
      </div>

      <FeatureLinks dict={dict} />

      <Link
        href="/mypage/fridge"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
          <Mascot name="fridge-open" size={30} />
        </span>
        <span className="flex-1 text-sm font-bold text-ink">{dict.mypage.fridge}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      <GlassCard className="mb-8 bg-white">
        <div className="divide-y divide-border">
          <Link
            href="/mypage/account"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.accountManagement}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/mypage/tags"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.tagManagement}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/mypage/activity"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.activityLog}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="bg-white">
        <div className="divide-y divide-border">
          <Link
            href="/"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.about}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/mypage/inquiry"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.contact}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.terms}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.privacy}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

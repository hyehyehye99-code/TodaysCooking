import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { getDictionary } from "@/lib/i18n/server";

// Kept in sync with FREE_WEEKLY_LIMIT in src/lib/actions/ai-recipe.ts — this
// page only displays the count, the actual enforcement lives server-side in
// that action.
const FREE_WEEKLY_LIMIT = 20;

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
  const supabase = await createClient();

  const entries = await Promise.all(
    households.map(async ({ household, role }) => {
      const { data: members } = await supabase.rpc("get_household_members", {
        target_household_id: household.id,
      });
      return { household, role, members: (members as Member[] | null) ?? [] };
    })
  );

  const me = entries
    .find((e) => e.household.id === current?.id)
    ?.members.find((m) => m.user_id === user?.id);
  const myNickname = me?.nickname ?? "";
  const myIconEmoji = me?.icon_emoji ?? null;

  const { data: promoGrant } = user
    ? await supabase.from("promo_code_redemptions").select("expires_at").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isUnlimited = !!promoGrant && (!promoGrant.expires_at || new Date(promoGrant.expires_at) > new Date());

  const planLimit = FREE_WEEKLY_LIMIT;
  const planSince = daysAgoIso(7);
  const { count: planUsageCount } = user
    ? await supabase
        .from("ai_recipe_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", planSince)
    : { count: 0 };
  const planUsed = Math.min(planUsageCount ?? 0, planLimit);

  return (
    <div>
      <PageHeader title={dict.mypage.title} />

      <GlassCard className="mb-8 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} />

        <div className="mt-4 border-t border-border pt-4">
          {isUnlimited ? (
            <>
              <p className="text-sm font-semibold text-ink">{dict.mypage.unlimitedActive}</p>
              <p className="mt-1 text-xs text-ink-soft">{dict.mypage.unlimitedDesc}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">{dict.mypage.freePlanActive}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {dict.mypage.usageWeeklyTemplate
                  .replace("{used}", String(planUsed))
                  .replace("{limit}", String(planLimit))}
              </p>
              <div className="mt-3">
                <ProgressBar percent={(planUsed / planLimit) * 100} colorClass="bg-positive" />
              </div>
            </>
          )}
        </div>
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.mypage.householdManagement}</p>
      <div className="mb-4">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
      </div>
      <div className="mb-8">
        <AddHouseholdSection />
      </div>

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
          <Link
            href="/mypage/creator-apply"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            크리에이터 지원하기
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

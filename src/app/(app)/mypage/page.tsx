import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { getDictionary } from "@/lib/i18n/server";

const CONTACT_URL = "mailto:hyehyehye1919@gmail.com?subject=%EC%9A%B0%EB%A6%AC%EC%A7%91%20%EB%A9%94%EB%89%B4%ED%8C%90%20%EB%AC%B8%EC%9D%98";

// Kept in sync with FREE_WEEKLY_LIMIT / PREMIUM_MONTHLY_LIMIT in
// src/lib/actions/ai-recipe.ts — this page only displays the count, the
// actual enforcement lives server-side in that action. Free and premium use
// different rolling windows (7 days vs 30), not just different caps.
const FREE_WEEKLY_LIMIT = 5;
const PREMIUM_MONTHLY_LIMIT = 100;

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export default async function MyPage() {
  const [{ user, household: current }, households, unreadCount, { dict }] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
    getUnreadNotificationCount(),
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

  // Only the active household's card shows a subscription button/detail
  // sheet (see HouseholdList), so this is the only household whose status
  // is worth a query here.
  const { data: sub } = current
    ? await supabase
        .from("household_subscriptions")
        .select("active, expires_at")
        .eq("household_id", current.id)
        .maybeSingle()
    : { data: null };
  const activeIsPremium = !!sub?.active && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  const { data: promoGrant } = user
    ? await supabase.from("promo_code_redemptions").select("user_id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isUnlimited = !!promoGrant;

  const planLimit = activeIsPremium ? PREMIUM_MONTHLY_LIMIT : FREE_WEEKLY_LIMIT;
  const planSince = daysAgoIso(activeIsPremium ? 30 : 7);
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
      <PageHeader
        title={dict.mypage.title}
        right={
          <Link
            href="/mypage/notifications"
            aria-label="알림"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-soft"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a5 5 0 0 0-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 16h14l-1.4-2.1a2.8 2.8 0 0 1-.6-1.7V9a5 5 0 0 0-5-5z" />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warn" />
            )}
          </Link>
        }
      />

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
              <p className="text-sm font-semibold text-ink">
                {activeIsPremium ? dict.mypage.premiumActive : dict.mypage.freePlanActive}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {(activeIsPremium ? dict.mypage.usageMonthlyTemplate : dict.mypage.usageWeeklyTemplate)
                  .replace("{used}", String(planUsed))
                  .replace("{limit}", String(planLimit))}
              </p>
              <div className="mt-3">
                <ProgressBar
                  percent={(planUsed / planLimit) * 100}
                  colorClass={activeIsPremium ? "bg-accent" : "bg-positive"}
                />
              </div>
              {current && sub?.expires_at && activeIsPremium && (
                <p className="mt-3 text-xs text-ink-faint">
                  {dict.mypage.nextBillingTemplate.replace(
                    "{date}",
                    new Date(sub.expires_at).toLocaleDateString("ko-KR")
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.mypage.householdManagement}</p>
      <div className="mb-4">
        <HouseholdList
          entries={entries}
          currentId={current?.id ?? ""}
          myUserId={user?.id ?? ""}
          activeIsPremium={activeIsPremium}
        />
      </div>
      <div className="mb-8">
        <AddHouseholdSection />
      </div>

      <GlassCard className="mb-8 bg-white">
        <div className="divide-y divide-border">
          <Link
            href="/mypage/subscription"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.subscriptionManagement}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/mypage/account"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.accountManagement}
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
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            {dict.mypage.contact}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
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

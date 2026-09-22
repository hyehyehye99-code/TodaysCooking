import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { getDictionary } from "@/lib/i18n/server";
import { GuestMyPage } from "./guest-mypage";
import { Mascot } from "@/components/Mascot";

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

  return (
    <div>
      <PageHeader title={dict.mypage.title} />

      <GlassCard className="mb-8 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} />

        <div className="mt-4 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Mascot name="sparkle" size={38} />
            {dict.mypage.aiUsageLabel}
          </p>
          {bonusRemaining > 0 ? (
            // While a bonus grant is active, every generation draws from it
            // first (see ai-recipe.ts) — the weekly free count stays frozen
            // in the meantime, so showing its bar here would read as "all
            // used up" right when the opposite is true.
            <p className="mt-1 text-xs font-semibold text-accent-ink">
              {dict.mypage.bonusRemainingTemplate.replace("{count}", String(bonusRemaining))}
            </p>
          ) : (
            <>
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

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink-soft">{dict.mypage.householdManagement}</p>
        <AddHouseholdSection />
      </div>
      <div className="mb-3">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
      </div>

      <Link
        href="/mypage/fridge"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M5 9h14" />
            <path d="M8 5v2" />
            <path d="M8 12v2" />
          </svg>
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

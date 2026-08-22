import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

// TODO: replace with the real pages once they exist.
const PRIVACY_POLICY_URL = "#";
const CONTACT_URL = "#";
const ABOUT_URL = "#";

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export default async function MyPage() {
  const [{ user, household: current }, households, unreadCount] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
    getUnreadNotificationCount(),
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

  // Sharing (the public /share link) and its tag filter only matter for the
  // active household, so this is a second small query rather than widening
  // the getMyHouseholds() shape every page pays for.
  const [{ data: sharing }, { data: recipeTagRows }] = current
    ? await Promise.all([
        supabase
          .from("households")
          .select("share_code, share_tags, share_updated_by, share_updated_at, share_last_action")
          .eq("id", current.id)
          .maybeSingle(),
        supabase.from("recipes").select("tags").eq("household_id", current.id),
      ])
    : [{ data: null }, { data: null }];
  const shareCode = sharing?.share_code ?? null;
  const shareTags = sharing?.share_tags ?? [];
  const shareableTags = [...new Set((recipeTagRows ?? []).flatMap((r) => r.tags ?? []))].sort();

  // Who last touched the share settings — resolved from the members list
  // already fetched above instead of a separate profiles lookup.
  const currentMembers = entries.find((e) => e.household.id === current?.id)?.members ?? [];
  const shareChangeLog =
    sharing?.share_updated_at && sharing.share_last_action
      ? {
          nickname: currentMembers.find((m) => m.user_id === sharing.share_updated_by)?.nickname ?? "누군가",
          action: sharing.share_last_action as "enabled" | "disabled" | "tags_changed",
          at: sharing.share_updated_at,
        }
      : null;

  // A member-facing preview of exactly what the public link currently shows
  // (same RPC the /share page itself calls, so the filtering always matches
  // exactly), plus like counts the public page intentionally doesn't show.
  let sharedPreview: {
    id: string;
    title: string;
    cover_photo_urls: string[];
    icon_emoji: string | null;
    likeCount: number;
  }[] = [];
  if (shareCode) {
    const { data: sharedRecipes } = await supabase.rpc("get_shared_recipes", { p_share_code: shareCode });
    const list =
      (sharedRecipes as
        | { id: string; title: string; cover_photo_urls: string[]; icon_emoji: string | null }[]
        | null) ?? [];
    if (list.length > 0) {
      const { data: reactions } = await supabase
        .from("recipe_reactions")
        .select("recipe_id")
        .in("recipe_id", list.map((r) => r.id));
      const counts = new Map<string, number>();
      (reactions ?? []).forEach((r) => counts.set(r.recipe_id, (counts.get(r.recipe_id) ?? 0) + 1));
      sharedPreview = list.map((r) => ({ ...r, likeCount: counts.get(r.id) ?? 0 }));
    }
  }

  return (
    <div>
      <PageHeader
        title="마이페이지"
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

      <GlassCard className="mb-4 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} />
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">설정</p>
      <GlassCard className="mb-8 bg-white">
        <PushNotificationToggle />
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">부엌 관리</p>
      <div className="mb-4">
        <HouseholdList
          entries={entries}
          currentId={current?.id ?? ""}
          myUserId={user?.id ?? ""}
          shareCode={shareCode}
          shareTags={shareTags}
          shareableTags={shareableTags}
          shareChangeLog={shareChangeLog}
          sharedPreview={sharedPreview}
        />
      </div>
      <div className="mb-8">
        <AddHouseholdSection />
      </div>

      <GlassCard className="mb-8 bg-white">
        <Link
          href="/mypage/account"
          className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
        >
          계정 관리
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </GlassCard>

      <GlassCard className="bg-white">
        <div className="divide-y divide-border">
          <a
            href={ABOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            소개
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            문의하기
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            개인정보처리방침
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </GlassCard>
    </div>
  );
}

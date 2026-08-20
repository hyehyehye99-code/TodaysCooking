import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export default async function MyPage() {
  const [{ user, household: current }, households] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
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
  const isGoogleAccount = user?.app_metadata?.provider === "google";

  // Sharing (the public /share link) and its tag filter only matter for the
  // active household, so this is a second small query rather than widening
  // the getMyHouseholds() shape every page pays for.
  const [{ data: sharing }, { data: recipeTagRows }] = current
    ? await Promise.all([
        supabase.from("households").select("share_code, share_tags").eq("id", current.id).maybeSingle(),
        supabase.from("recipes").select("tags").eq("household_id", current.id),
      ])
    : [{ data: null }, { data: null }];
  const shareCode = sharing?.share_code ?? null;
  const shareTags = sharing?.share_tags ?? [];
  const shareableTags = [...new Set((recipeTagRows ?? []).flatMap((r) => r.tags ?? []))].sort();

  return (
    <div>
      <PageHeader title="마이페이지" />

      <GlassCard className="mb-8 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} isGoogleAccount={isGoogleAccount} />
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
        />
      </div>
      <div className="mb-8">
        <AddHouseholdSection />
      </div>

      <GlassCard className="bg-white">
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
    </div>
  );
}

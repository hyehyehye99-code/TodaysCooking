import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { chefName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ProfileAvatar } from "@/components/ProfileAvatar";
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

  return (
    <div>
      <PageHeader title="마이페이지" />

      <GlassCard className="mb-8 flex items-center gap-3 bg-white p-4">
        <ProfileAvatar iconEmoji={myIconEmoji} nickname={myNickname} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{chefName(myNickname)}</p>
          {isGoogleAccount && <p className="mt-0.5 text-xs text-ink-soft">구글로 가입했어요</p>}
        </div>
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">부엌 관리</p>
      <div className="mb-4">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
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

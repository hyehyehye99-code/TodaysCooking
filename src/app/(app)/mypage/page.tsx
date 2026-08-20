import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { chefName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "./nickname-form";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { DeleteAccountButton } from "./delete-account-button";

type Member = { user_id: string; nickname: string; role: string; joined_at: string };

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

  const myNickname =
    entries
      .find((e) => e.household.id === current?.id)
      ?.members.find((m) => m.user_id === user?.id)?.nickname ?? "";

  return (
    <div>
      <PageHeader title="마이페이지" />

      <GlassCard className="mb-6 bg-white p-4">
        <p className="mb-1 text-[11px] font-bold text-ink-faint">닉네임</p>
        <p className="mb-3 text-xl font-bold">{chefName(myNickname)}</p>
        <NicknameForm currentNickname={myNickname} />
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">내 부엌</p>

      <div className="mb-4">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
      </div>

      <AddHouseholdSection />

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <form action={signOut}>
          <button type="submit" className="text-sm text-ink-faint underline">
            로그아웃
          </button>
        </form>
        <DeleteAccountButton />
      </div>
    </div>
  );
}

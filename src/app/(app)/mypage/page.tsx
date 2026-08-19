import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { createHousehold, joinHousehold } from "@/lib/actions/household";
import { signOut } from "@/lib/actions/auth";
import { chefName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";
import { NicknameForm } from "./nickname-form";

export default async function MyPage() {
  const { user, household: current } = await getCurrentHousehold();
  const households = await getMyHouseholds();
  const supabase = await createClient();

  let myNickname = "";
  if (current) {
    const { data: members } = await supabase.rpc("get_household_members", {
      target_household_id: current.id,
    });
    myNickname = (members ?? []).find((m: { user_id: string }) => m.user_id === user?.id)?.nickname ?? "";
  }

  return (
    <div>
      <PageHeader title="마이페이지" />

      <div className="mb-6 flex flex-col gap-2.5">
        {households.map(({ household, role }) => {
          const active = household.id === current?.id;
          return (
            <Link key={household.id} href={`/mypage/${household.id}`}>
              <GlassCard
                className={`flex items-center justify-between bg-white p-4 ${active ? "ring-2 ring-accent" : ""}`}
              >
                <div>
                  <p className="text-[15px] font-bold">{household.name}</p>
                  {role === "owner" && (
                    <p className="mt-0.5 text-xs text-ink-faint">내가 대장인 요리책</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {active && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                      사용 중
                    </span>
                  )}
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">새 요리책 만들기</p>
          <CreateHouseholdForm action={createHousehold} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">코드로 참여하기</p>
          <JoinHouseholdForm action={joinHousehold} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-1 text-[13px] font-bold">내 닉네임</p>
          <p className="mb-3 text-xs text-ink-soft">
            요리책 안에서 {chefName(myNickname || "닉네임")}로 불려요.
          </p>
          <NicknameForm currentNickname={myNickname} />
        </GlassCard>
      </div>

      <form action={signOut} className="mt-6">
        <button type="submit" className="text-sm text-ink-faint underline">
          로그아웃
        </button>
      </form>
    </div>
  );
}

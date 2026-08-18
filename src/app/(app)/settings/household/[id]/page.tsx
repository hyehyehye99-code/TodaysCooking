import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { switchHousehold } from "@/lib/actions/household";
import { chefName } from "@/lib/format";
import { InviteForm } from "../../invite-form";
import { LeaveHouseholdButton } from "../leave-household-button";

type Member = { user_id: string; nickname: string; role: string; joined_at: string };

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, household: current } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: household } = await supabase
    .from("households")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!household) notFound();

  const { data: members } = await supabase.rpc("get_household_members", {
    target_household_id: id,
  });
  const memberList = (members as Member[] | null) ?? [];
  const myRole = memberList.find((m) => m.user_id === user?.id)?.role;
  const active = household.id === current?.id;

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        {active ? (
          <Link
            href="/recipes"
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Link>
        ) : (
          <Link href="/settings/household" className="mr-auto text-sm text-ink-soft">
            ← 요리책 관리
          </Link>
        )}
      </div>
      <PageHeader title={household.name} />

      {active ? (
        <GlassCard className="mb-4 border-transparent bg-accent/8 px-4 py-3">
          <p className="text-sm font-bold text-accent-ink">지금 사용 중인 요리책이에요</p>
        </GlassCard>
      ) : (
        <form action={switchHousehold} className="mb-4">
          <input type="hidden" name="householdId" value={household.id} />
          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white"
          >
            이 요리책 사용하기
          </button>
        </form>
      )}

      <GlassCard className="mb-4 bg-white p-4">
        <p className="mb-3 text-[13px] font-bold">참여 인원 ({memberList.length}명)</p>
        <div className="flex flex-col gap-2.5">
          {memberList.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between">
              <span className="text-sm">
                {chefName(m.nickname)}
                {m.user_id === user?.id && <span className="ml-1.5 text-xs text-ink-faint">(나)</span>}
              </span>
              {m.role === "owner" && (
                <span className="rounded-full bg-accent/8 px-2 py-0.5 text-[10px] font-bold text-accent">
                  대장
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mb-4 bg-white p-4">
        <p className="mb-1 text-[13px] font-bold">함께 쓸 사람 초대하기</p>
        <p className="mb-3 text-xs text-ink-soft">
          코드를 만들어 상대방에게 공유하면, 로그인 후 초대 코드로 이 요리책에 들어올 수 있어요.
        </p>
        <InviteForm householdId={household.id} />
      </GlassCard>

      <div className="flex justify-end">
        <LeaveHouseholdButton
          householdId={household.id}
          householdName={household.name}
          isOwner={myRole === "owner"}
        />
      </div>
    </div>
  );
}

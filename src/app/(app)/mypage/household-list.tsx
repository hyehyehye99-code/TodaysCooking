"use client";

import { switchHousehold } from "@/lib/actions/household";
import { GlassCard } from "@/components/ui";
import { InviteButton } from "./invite-button";
import { HouseholdDetailButton } from "./household-detail-button";

type Member = { user_id: string; nickname: string; role: string; joined_at: string };
type HouseholdEntry = {
  household: { id: string; name: string; invite_code: string };
  role: string;
  members: Member[];
};

export function HouseholdList({
  entries,
  currentId,
  myUserId,
}: {
  entries: HouseholdEntry[];
  currentId: string;
  myUserId: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ household, role, members }) => {
        const active = household.id === currentId;

        return (
          <GlassCard
            key={household.id}
            className={`bg-white p-4 ${active ? "ring-2 ring-accent" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <HouseholdDetailButton
                householdId={household.id}
                householdName={household.name}
                members={members}
                myUserId={myUserId}
                myRole={role}
              />
              {active ? (
                <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                  사용 중
                </span>
              ) : (
                <form action={switchHousehold}>
                  <input type="hidden" name="householdId" value={household.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink-soft"
                  >
                    전환하기
                  </button>
                </form>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-soft">참여 인원 {members.length}명</span>
              <InviteButton householdName={household.name} inviteCode={household.invite_code} />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

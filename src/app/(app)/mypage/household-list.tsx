"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { switchHousehold } from "@/lib/actions/household";
import { chefName } from "@/lib/format";
import { InviteForm } from "./invite-form";
import { LeaveHouseholdButton } from "./leave-household-button";
import { RenameHouseholdForm } from "./rename-household-form";

type Member = { user_id: string; nickname: string; role: string; joined_at: string };
type HouseholdEntry = {
  household: { id: string; name: string };
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
  const [expandedId, setExpandedId] = useState<string | null>(currentId || null);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ household, role, members }) => {
        const active = household.id === currentId;
        const isOpen = expandedId === household.id;
        const myRole = members.find((m) => m.user_id === myUserId)?.role;

        return (
          <GlassCard
            key={household.id}
            className={`bg-white p-4 ${active ? "ring-2 ring-accent" : ""}`}
          >
            <button
              type="button"
              onClick={() => setExpandedId((prev) => (prev === household.id ? null : household.id))}
              className="flex w-full items-center justify-between"
            >
              <div className="text-left">
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
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="var(--color-ink-faint)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
                <div>
                  <p className="mb-2.5 text-xs font-bold text-ink-soft">요리책 이름</p>
                  <RenameHouseholdForm householdId={household.id} currentName={household.name} />
                </div>

                {!active && (
                  <form action={switchHousehold}>
                    <input type="hidden" name="householdId" value={household.id} />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white"
                    >
                      이 요리책 사용하기
                    </button>
                  </form>
                )}

                <div>
                  <p className="mb-2.5 text-xs font-bold text-ink-soft">
                    참여 인원 ({members.length}명)
                  </p>
                  <div className="flex flex-col gap-2">
                    {members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between">
                        <span className="text-sm">
                          {chefName(m.nickname)}
                          {m.user_id === myUserId && (
                            <span className="ml-1.5 text-xs text-ink-faint">(나)</span>
                          )}
                        </span>
                        {m.role === "owner" && (
                          <span className="rounded-full bg-accent/8 px-2 py-0.5 text-[10px] font-bold text-accent">
                            대장
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold text-ink-soft">함께 쓸 사람 초대하기</p>
                  <p className="mb-2.5 text-[11px] text-ink-faint">
                    코드를 만들어 상대방에게 공유하면, 로그인 후 초대 코드로 이 요리책에 들어올 수
                    있어요.
                  </p>
                  <InviteForm householdId={household.id} />
                </div>

                <div className="flex justify-end">
                  <LeaveHouseholdButton
                    householdId={household.id}
                    householdName={household.name}
                    isOwner={myRole === "owner"}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

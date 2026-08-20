"use client";

import { switchHousehold } from "@/lib/actions/household";
import { GlassCard } from "@/components/ui";
import { InviteButton } from "./invite-button";
import { HouseholdDetailButton } from "./household-detail-button";
import { ShareMenuButton } from "./share-menu-button";

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };
type HouseholdEntry = {
  household: { id: string; name: string; invite_code: string };
  role: string;
  members: Member[];
};

type ShareChangeLog = {
  nickname: string;
  action: "enabled" | "disabled" | "tags_changed";
  at: string;
} | null;

export function HouseholdList({
  entries,
  currentId,
  myUserId,
  shareCode,
  shareTags,
  shareableTags,
  shareChangeLog,
}: {
  entries: HouseholdEntry[];
  currentId: string;
  myUserId: string;
  shareCode: string | null;
  shareTags: string[];
  shareableTags: string[];
  shareChangeLog: ShareChangeLog;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(({ household, role, members }) => {
        const active = household.id === currentId;

        if (!active) {
          return (
            <form key={household.id} action={switchHousehold}>
              <input type="hidden" name="householdId" value={household.id} />
              <button type="submit" className="block w-full text-left">
                <GlassCard className="flex items-center justify-between gap-2 bg-white p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold">{household.name}</p>
                    <p className="mt-1 text-xs text-ink-soft">참여 인원 {members.length}명</p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="var(--color-ink-faint)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </GlassCard>
              </button>
            </form>
          );
        }

        return (
          <GlassCard key={household.id} className="bg-white p-4 ring-2 ring-accent">
            <div className="flex items-center justify-between gap-2">
              <HouseholdDetailButton
                householdId={household.id}
                householdName={household.name}
                members={members}
                myUserId={myUserId}
                myRole={role}
              />
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                사용 중
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-soft">참여 인원 {members.length}명</span>
              <div className="flex items-center gap-1.5">
                <ShareMenuButton
                  householdId={household.id}
                  householdName={household.name}
                  initialShareCode={shareCode}
                  initialShareTags={shareTags}
                  shareableTags={shareableTags}
                  changeLog={shareChangeLog}
                />
                <InviteButton householdName={household.name} inviteCode={household.invite_code} />
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

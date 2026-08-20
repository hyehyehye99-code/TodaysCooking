"use client";

import { useState } from "react";
import { chefName } from "@/lib/format";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { RenameHouseholdForm } from "./rename-household-form";
import { RemoveMemberButton } from "./remove-member-button";
import { LeaveHouseholdButton } from "./leave-household-button";
import { Modal } from "@/components/Modal";

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export function HouseholdDetailButton({
  householdId,
  householdName,
  members,
  myUserId,
  myRole,
}: {
  householdId: string;
  householdName: string;
  members: Member[];
  myUserId: string;
  myRole?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
      >
        <span className="truncate text-[15px] font-bold">{householdName}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-4 text-[15px] font-bold">부엌 정보</p>

            <p className="mb-2 text-xs font-bold text-ink-soft">부엌 이름</p>
            <RenameHouseholdForm
              householdId={householdId}
              currentName={householdName}
              onSuccess={() => setOpen(false)}
            />

            <p className="mb-2.5 mt-6 text-xs font-bold text-ink-soft">참여 인원 ({members.length}명)</p>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <ProfileAvatar iconEmoji={m.icon_emoji} nickname={m.nickname} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {chefName(m.nickname)}
                      {m.user_id === myUserId && (
                        <span className="ml-1 text-xs font-normal text-ink-faint">(나)</span>
                      )}
                    </p>
                    {m.role === "owner" && <p className="text-[11px] text-accent">대장</p>}
                  </div>
                  {myRole === "owner" && m.user_id !== myUserId && (
                    <RemoveMemberButton
                      householdId={householdId}
                      userId={m.user_id}
                      nickname={chefName(m.nickname)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <LeaveHouseholdButton
                householdId={householdId}
                householdName={householdName}
                isOwner={myRole === "owner"}
                hasOtherMembers={members.length > 1}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-ink-soft"
              >
                닫기
              </button>
            </div>
        </div>
      </Modal>
    </>
  );
}

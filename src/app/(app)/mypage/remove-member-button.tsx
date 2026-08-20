"use client";

import { useState } from "react";
import { removeMember } from "@/lib/actions/household";

export function RemoveMemberButton({
  householdId,
  userId,
  nickname,
}: {
  householdId: string;
  userId: string;
  nickname: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-ink-soft">{nickname}님을 내보낼까요?</span>
        <button type="button" onClick={() => setConfirming(false)} className="text-ink-soft underline">
          취소
        </button>
        <form action={removeMember}>
          <input type="hidden" name="householdId" value={householdId} />
          <input type="hidden" name="userId" value={userId} />
          <button type="submit" className="font-bold text-warn-ink underline">
            내보내기
          </button>
        </form>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[11px] text-ink-faint underline"
    >
      내보내기
    </button>
  );
}

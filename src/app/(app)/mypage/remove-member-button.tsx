"use client";

import { useState } from "react";
import { removeMember } from "@/lib/actions/household";
import { ConfirmModal } from "@/components/ConfirmModal";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-ink-faint underline"
      >
        내보내기
      </button>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`${nickname}님을 내보낼까요?`}
        description="내보내면 이 우리집의 메뉴판·냉장고·장보기 목록에 더 이상 접근할 수 없어요."
        confirmSlot={
          <form action={removeMember}>
            <input type="hidden" name="householdId" value={householdId} />
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white"
            >
              내보내기
            </button>
          </form>
        }
      />
    </>
  );
}

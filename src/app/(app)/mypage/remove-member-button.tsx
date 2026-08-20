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

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-ink-faint underline"
      >
        내보내기
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-bold text-ink">{nickname}님을 내보낼까요?</p>
            <p className="mt-2 text-xs text-ink-soft">
              내보내면 이 부엌의 메뉴판·냉장고·장보기 목록에 더 이상 접근할 수 없어요.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
              >
                취소
              </button>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

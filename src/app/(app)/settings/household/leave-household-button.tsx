"use client";

import { useState } from "react";
import { leaveHousehold } from "@/lib/actions/household";

export function LeaveHouseholdButton({
  householdId,
  householdName,
  isOwner,
}: {
  householdId: string;
  householdName: string;
  isOwner: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typedName, setTypedName] = useState("");

  function close() {
    setConfirming(false);
    setTypedName("");
  }

  if (confirming && !isOwner) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-soft">정말 나갈까요?</span>
        <button type="button" onClick={close} className="text-xs text-ink-soft underline">
          취소
        </button>
        <form action={leaveHousehold}>
          <input type="hidden" name="householdId" value={householdId} />
          <button type="submit" className="text-xs font-bold text-warn-ink underline">
            나가기
          </button>
        </form>
      </div>
    );
  }

  const canDelete = typedName === householdName;

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className="text-xs text-ink-faint underline">
        나가기
      </button>

      {confirming && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-bold text-warn-ink">
              대장이 나가면 모든 요리책이 삭제돼요. 그래도 괜찮아요?
            </p>
            <p className="mt-2 text-xs text-ink-soft">
              확인을 위해 요리책 이름 <span className="font-bold text-ink">{householdName}</span>
              을(를) 입력해주세요.
            </p>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={householdName}
              className="mt-3 w-full rounded-lg border border-transparent bg-surface px-3 py-2.5 text-sm outline-none focus:border-warn"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
              >
                취소
              </button>
              <form action={leaveHousehold}>
                <input type="hidden" name="householdId" value={householdId} />
                <button
                  type="submit"
                  disabled={!canDelete}
                  className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  나가기 (삭제)
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

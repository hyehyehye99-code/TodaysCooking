"use client";

import { useState } from "react";
import { leaveHousehold } from "@/lib/actions/household";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ClearableInput } from "@/components/ClearableInput";

export function LeaveHouseholdButton({
  householdId,
  householdName,
  isOwner,
  hasOtherMembers,
}: {
  householdId: string;
  householdName: string;
  isOwner: boolean;
  hasOtherMembers: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typedName, setTypedName] = useState("");

  function close() {
    setConfirming(false);
    setTypedName("");
  }

  // Only genuinely destructive (the household itself gets deleted) when the
  // owner leaves with no one else to hand it off to — that's the only case
  // worth the extra typed-confirmation friction.
  const destructive = isOwner && !hasOtherMembers;

  let message: string;
  if (isOwner && hasOtherMembers) {
    message = "대장 자리는 가장 먼저 들어온 다른 참여자에게 자동으로 넘어가요.";
  } else if (isOwner) {
    message = "함께 쓰는 사람이 없어서, 나가면 이 우리집이 완전히 삭제돼요.";
  } else {
    message = "언제든 초대 코드나 링크로 다시 참여할 수 있어요.";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-ink-faint underline"
      >
        나가기
      </button>

      <ConfirmModal
        open={confirming}
        onClose={close}
        title="정말 이 우리집에서 나가시겠어요?"
        description={message}
        confirmSlot={
          <form action={leaveHousehold}>
            <input type="hidden" name="householdId" value={householdId} />
            <button
              type="submit"
              disabled={destructive && typedName !== householdName}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                destructive ? "bg-warn" : "bg-accent"
              }`}
            >
              나가기
            </button>
          </form>
        }
      >
        {destructive && (
          <>
            <p className="mt-3 text-xs text-ink-soft">
              확인을 위해 우리집 이름 <span className="font-bold text-ink">{householdName}</span>
              을(를) 입력해주세요.
            </p>
            <ClearableInput
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={householdName}
              className="mt-3 w-full rounded-lg border border-transparent bg-surface px-3 py-2.5 text-sm outline-none focus:border-warn"
            />
          </>
        )}
      </ConfirmModal>
    </>
  );
}

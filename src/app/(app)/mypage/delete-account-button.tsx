"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/lib/actions/household";

const CONFIRM_WORD = "탈퇴";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setConfirming(false);
    setTyped("");
    setError(null);
  }

  function doDelete() {
    startTransition(async () => {
      const result = await deleteMyAccount();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-ink-faint"
      >
        회원 탈퇴
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-bold text-ink">탈퇴하면 계정이 완전히 삭제돼요</p>
            <p className="mt-2 text-xs text-ink-soft">
              내가 대장인 부엌은 가장 먼저 들어온 다른 참여자에게 넘어가고, 나 혼자 있는 부엌은 함께
              삭제돼요. 되돌릴 수 없어요.
            </p>
            <p className="mt-3 text-xs text-ink-soft">
              확인을 위해 <span className="font-bold text-ink">{CONFIRM_WORD}</span>를 입력해주세요.
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="mt-3 w-full rounded-lg border border-transparent bg-surface px-3 py-2.5 text-sm outline-none focus:border-ink-soft"
            />
            {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={typed !== CONFIRM_WORD || pending}
                className="rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {pending ? "탈퇴하는 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

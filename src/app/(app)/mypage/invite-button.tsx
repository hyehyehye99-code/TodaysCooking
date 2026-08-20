"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

export function InviteButton({
  householdName,
  inviteCode,
}: {
  householdName: string;
  inviteCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/join?code=${inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white"
      >
        초대하기
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-1 text-[15px] font-bold">{householdName}에 초대하기</p>
            <p className="mb-4 text-xs text-ink-soft">
              링크를 보내면 상대방이 눌러서 로그인 후 바로 참여할 수 있어요.
            </p>

            <button
              type="button"
              onClick={copyLink}
              className={`w-full rounded-xl border py-3.5 text-sm font-bold ${
                copiedLink
                  ? "border-accent bg-white text-accent-ink"
                  : "border-transparent bg-accent text-white"
              }`}
            >
              {copiedLink ? "링크를 복사했어요!" : "초대 링크 복사하기"}
            </button>

            {!showCode ? (
              <button
                type="button"
                onClick={() => setShowCode(true)}
                className="mt-3 w-full text-center text-xs font-bold text-ink-faint underline"
              >
                코드로 직접 초대하기
              </button>
            ) : (
              <button
                type="button"
                onClick={copyCode}
                className="mt-3 w-full rounded-xl border border-transparent bg-surface px-4 py-3 text-center"
              >
                <p className="text-[11px] text-ink-soft">
                  {copiedCode ? "복사했어요!" : "눌러서 코드 복사하기"}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-[0.2em]">{inviteCode}</p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
            >
              닫기
            </button>
        </div>
      </Modal>
    </>
  );
}

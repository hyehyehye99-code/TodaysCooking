"use client";

import { useState } from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Modal } from "@/components/Modal";
import { chefName } from "@/lib/format";
import { ProfileForm } from "./profile-form";

export function ProfileEditButton({
  nickname,
  iconEmoji,
  isGoogleAccount,
}: {
  nickname: string;
  iconEmoji: string | null;
  isGoogleAccount: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 text-left">
        <ProfileAvatar iconEmoji={iconEmoji} nickname={nickname} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{chefName(nickname)}</p>
          {isGoogleAccount && <p className="mt-0.5 text-xs text-ink-soft">구글로 가입했어요</p>}
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
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          <p className="mb-4 text-[15px] font-bold">프로필 수정</p>
          <ProfileForm currentNickname={nickname} currentIconEmoji={iconEmoji} />
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

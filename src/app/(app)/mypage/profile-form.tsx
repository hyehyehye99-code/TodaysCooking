"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export function ProfileForm({
  currentNickname,
  currentIconEmoji,
}: {
  currentNickname: string;
  currentIconEmoji: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);
  const [nickname, setNickname] = useState(currentNickname);
  const [iconEmoji, setIconEmoji] = useState(currentIconEmoji ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar iconEmoji={iconEmoji} nickname={nickname} size={48} />
        <input
          name="nickname"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm font-bold outline-none focus:border-accent"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-ink-soft">아이콘</p>
        <EmojiPicker name="iconEmoji" defaultValue={currentIconEmoji} onChange={setIconEmoji} />
      </div>

      <p className="text-[11px] text-ink-faint">
        부엌 안에서 &ldquo;{nickname.trim() || "닉네임"}셰프&rdquo;로 불려요
      </p>

      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      {state?.success && <p className="text-xs text-positive-ink">프로필을 저장했어요.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

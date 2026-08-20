"use client";

import { useActionState, useState } from "react";
import { updateNickname } from "@/lib/actions/profile";

export function NicknameForm({ currentNickname }: { currentNickname: string }) {
  const [state, formAction, pending] = useActionState(updateNickname, undefined);
  const [value, setValue] = useState(currentNickname);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="nickname"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="닉네임"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
      <p className="text-[11px] text-ink-faint">
        부엌 안에서 &ldquo;{value.trim() || "닉네임"}셰프&rdquo;로 불려요
      </p>
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      {state?.success && <p className="text-xs text-positive-ink">닉네임을 저장했어요.</p>}
    </form>
  );
}

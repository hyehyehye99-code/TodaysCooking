"use client";

import { useActionState } from "react";
import { createCreator } from "@/lib/actions/admin";
import { EmojiPicker } from "@/components/EmojiPicker";

const CHANNEL_TYPES = ["유튜브", "블로그", "인스타그램", "기타"];

export function NewCreatorForm() {
  const [state, formAction, pending] = useActionState(createCreator, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="name"
        required
        placeholder="크리에이터 이름 *"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <select
          name="channelType"
          defaultValue=""
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">채널 종류</option>
          {CHANNEL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          name="channelName"
          placeholder="채널 이름"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <input
        name="channelLink"
        type="url"
        placeholder="채널 링크 (https://...)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <input
        name="tags"
        placeholder="태그 (쉼표로 구분, 예: 자취요리,밀프렙)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div>
        <p className="mb-1.5 text-xs text-ink-soft">아이콘 이모지</p>
        <EmojiPicker name="iconEmoji" />
      </div>
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "추가하는 중..." : "크리에이터 추가"}
      </button>
    </form>
  );
}

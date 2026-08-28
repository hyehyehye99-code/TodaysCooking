"use client";

import { useActionState } from "react";
import { updateCreator } from "@/lib/actions/admin";
import { EmojiPicker } from "@/components/EmojiPicker";

const CHANNEL_TYPES = ["유튜브", "블로그", "인스타그램", "기타"];

type Creator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  channel_type: string | null;
  channel_name: string | null;
  channel_link: string | null;
  tags: string[];
};

export function EditCreatorForm({ creator, onDone }: { creator: Creator; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateCreator.bind(null, creator.id), null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="name"
        required
        defaultValue={creator.name}
        placeholder="크리에이터 이름 *"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <select
          name="channelType"
          defaultValue={creator.channel_type ?? ""}
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
          defaultValue={creator.channel_name ?? ""}
          placeholder="채널 이름"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <input
        name="channelLink"
        type="url"
        defaultValue={creator.channel_link ?? ""}
        placeholder="채널 링크 (https://...)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <input
        name="tags"
        defaultValue={creator.tags.join(", ")}
        placeholder="태그 (쉼표로 구분, 예: 자취요리,밀프렙)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div>
        <p className="mb-1.5 text-xs text-ink-soft">아이콘 이모지</p>
        <EmojiPicker name="iconEmoji" defaultValue={creator.icon_emoji} />
      </div>
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장하는 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft disabled:opacity-60"
        >
          취소
        </button>
      </div>
    </form>
  );
}

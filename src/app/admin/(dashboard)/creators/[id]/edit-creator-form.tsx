"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateCreator } from "@/lib/actions/admin";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { EmojiPicker } from "@/components/EmojiPicker";

const CHANNEL_TYPES = ["유튜브", "블로그", "인스타그램", "기타"];

function inferChannelType(url: string): string | null {
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    if (/(^|\.)youtube\.com$|youtu\.be$/.test(hostname)) return "유튜브";
    if (/(^|\.)instagram\.com$/.test(hostname)) return "인스타그램";
    if (/(^|\.)(blog\.naver\.com|tistory\.com|brunch\.co\.kr)$/.test(hostname)) return "블로그";
    return null;
  } catch {
    return null;
  }
}

type Creator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  avatar_url: string | null;
  channel_type: string | null;
  channel_link: string | null;
};

export function EditCreatorForm({ creator, onDone }: { creator: Creator; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateCreator.bind(null, creator.id), null);

  const nameRef = useRef<HTMLInputElement>(null);
  const channelLinkRef = useRef<HTMLInputElement>(null);
  const avatarUrlRef = useRef<HTMLInputElement>(null);
  const channelTypeRef = useRef<HTMLSelectElement>(null);

  const [fetchPending, startFetchTransition] = useTransition();
  const [fetchError, setFetchError] = useState<string | null>(null);

  function handleFetchInfo() {
    const url = channelLinkRef.current?.value.trim();
    if (!url) return;
    setFetchError(null);
    startFetchTransition(async () => {
      const preview = await fetchLinkPreview(url);
      if (!preview.ok) {
        setFetchError(preview.error);
        return;
      }
      if (preview.title && nameRef.current) nameRef.current.value = preview.title;
      if (preview.thumbnailUrl && avatarUrlRef.current) avatarUrlRef.current.value = preview.thumbnailUrl;
      const inferredType = inferChannelType(url);
      if (inferredType && channelTypeRef.current) channelTypeRef.current.value = inferredType;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          ref={channelLinkRef}
          name="channelLink"
          type="url"
          defaultValue={creator.channel_link ?? ""}
          placeholder="채널 링크 (https://...)"
          className="w-full min-w-0 flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleFetchInfo}
          disabled={fetchPending}
          className="shrink-0 rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink disabled:opacity-60"
        >
          {fetchPending ? "가져오는 중..." : "정보 가져오기"}
        </button>
      </div>
      {fetchError && <p className="text-xs text-warn-ink">{fetchError}</p>}

      <input
        ref={nameRef}
        name="name"
        required
        defaultValue={creator.name}
        placeholder="크리에이터 이름 *"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <select
        ref={channelTypeRef}
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
        ref={avatarUrlRef}
        name="avatarUrl"
        type="url"
        defaultValue={creator.avatar_url ?? ""}
        placeholder="프로필 이미지 URL (선택, 없으면 이모지 아이콘 사용)"
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

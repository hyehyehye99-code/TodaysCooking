"use client";

import { useState } from "react";

// Same share-or-copy behaviour as the household invite button on 마이페이지.
export function InviteTicketRow({ householdName, inviteCode }: { householdName: string; inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/join?code=${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${householdName}에 초대하기`, url });
      } catch {
        // The user dismissed the share sheet — nothing to show.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={share} className="flex w-full items-center gap-3 rounded-[28px] bg-white px-5 py-4 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg">🎟️</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">친구 1명을 초대할 때마다</span>
        <span className="block text-xs text-ink-soft">
          {copied ? "초대 링크를 복사했어요" : "새로 가입한 친구랑 나 둘 다 받아요"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink">
        <span className="inline-block h-3.5 w-3.5 rotate-45 rounded-[4px] bg-accent" />
        1장
      </span>
    </button>
  );
}

"use client";

import { useState } from "react";

export function InviteForm({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-full rounded-xl border border-transparent bg-surface px-4 py-3 text-center"
    >
      <p className="text-[11px] text-ink-soft">{copied ? "복사했어요!" : "눌러서 코드 복사하기"}</p>
      <p className="mt-1 text-2xl font-bold tracking-[0.2em]">{inviteCode}</p>
    </button>
  );
}

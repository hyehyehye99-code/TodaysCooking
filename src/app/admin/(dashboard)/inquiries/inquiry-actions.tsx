"use client";

import { useState, useTransition } from "react";
import { resolveInquiry, reopenInquiry } from "@/lib/actions/admin";

export function InquiryActions({ inquiryId }: { inquiryId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleResolve() {
    setError(null);
    startTransition(async () => {
      const result = await resolveInquiry(inquiryId, note);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="mt-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="답변 (선택)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleResolve}
          disabled={pending}
          className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "처리 중..." : "답변 완료 처리"}
        </button>
      </div>
      {error && <p className="mt-1 text-right text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

export function ReopenButton({ inquiryId }: { inquiryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          reopenInquiry(inquiryId);
        })
      }
      disabled={pending}
      className="text-xs font-bold text-ink-faint underline disabled:opacity-60"
    >
      {pending ? "처리 중..." : "다시 열기"}
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { resolveAiReport } from "@/lib/actions/admin";

export function AiReportActions({ reportId, generationId }: { reportId: string; generationId: string }) {
  const [pending, startTransition] = useTransition();

  function handle(refund: boolean) {
    startTransition(() => {
      resolveAiReport(reportId, generationId, refund);
    });
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => handle(true)}
        disabled={pending}
        className="flex-1 rounded-lg bg-accent py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? "처리 중..." : "횟수 환불하고 삭제"}
      </button>
      <button
        type="button"
        onClick={() => handle(false)}
        disabled={pending}
        className="flex-1 rounded-lg bg-surface py-2 text-xs font-bold text-ink-soft disabled:opacity-60"
      >
        {pending ? "처리 중..." : "환불 없이 삭제"}
      </button>
    </div>
  );
}

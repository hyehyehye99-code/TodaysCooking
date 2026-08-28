"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { approveCreatorApplication, rejectCreatorApplication } from "@/lib/actions/admin";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [approvedCreatorId, setApprovedCreatorId] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveCreatorApplication(applicationId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setApprovedCreatorId(result.creatorId);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectCreatorApplication(applicationId);
      if ("error" in result) setError(result.error);
    });
  }

  if (approvedCreatorId) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-positive/10 px-3 py-2">
        <span className="text-xs font-bold text-positive-ink">크리에이터로 등록했어요</span>
        <Link href={`/admin/creators/${approvedCreatorId}`} className="text-xs font-bold text-accent-ink underline">
          보러가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          className="flex-1 rounded-lg bg-accent py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "처리 중..." : "승인"}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className="flex-1 rounded-lg bg-surface py-2 text-xs font-bold text-ink-soft disabled:opacity-60"
        >
          {pending ? "처리 중..." : "거절"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

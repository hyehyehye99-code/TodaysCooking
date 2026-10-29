"use client";

import { useState, useTransition } from "react";
import { redeemResetTicket } from "@/lib/actions/tickets";
import type { TicketKind } from "@/lib/tickets";

const ROWS: { kind: TicketKind; title: string; desc: string; tone: string }[] = [
  { kind: "full", title: "전체 초기화 티켓", desc: "사용량이 0%로 초기화돼요", tone: "bg-accent" },
  { kind: "half", title: "절반 초기화 티켓", desc: "사용량이 50% 내려가요", tone: "bg-violet-500" },
];

function TicketIcon({ tone }: { tone: string }) {
  return <span className={`inline-block h-3.5 w-3.5 shrink-0 rotate-45 rounded-[4px] ${tone}`} />;
}

export function TicketCard({
  counts,
  usagePercent,
}: {
  counts: Record<TicketKind, number>;
  usagePercent: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function spend(kind: TicketKind) {
    setError(null);
    startTransition(async () => {
      const r = await redeemResetTicket(kind);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="rounded-[28px] bg-white p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-[15px] font-bold text-ink">사용량 초기화 티켓</p>
        <p className="flex items-center gap-3 text-sm font-semibold text-ink">
          {ROWS.map((r) => (
            <span key={r.kind} className="flex items-center gap-1.5">
              <TicketIcon tone={r.tone} />
              {counts[r.kind]}
            </span>
          ))}
        </p>
      </div>

      <div className="divide-y divide-border">
        {ROWS.map((r) => {
          const disabled = pending || counts[r.kind] === 0 || usagePercent === 0;
          return (
            <div key={r.kind} className="flex items-center gap-3 py-3.5">
              <TicketIcon tone={r.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{r.title}</p>
                <p className="text-xs text-ink-soft">{r.desc}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => spend(r.kind)}
                className="rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink disabled:opacity-40"
              >
                사용
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-1 text-xs font-semibold text-warn-ink">{error}</p>}
    </div>
  );
}

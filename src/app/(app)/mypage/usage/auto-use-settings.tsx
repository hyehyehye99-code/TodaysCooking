"use client";

import { useState, useTransition } from "react";
import { saveUsageSettings } from "@/lib/actions/tickets";
import type { TicketOrder, UsageSettings } from "@/lib/tickets";

export function AutoUseSettings({ initial }: { initial: UsageSettings }) {
  const [autoUse, setAutoUse] = useState(initial.autoUse);
  const [order, setOrder] = useState<TicketOrder>(initial.order);
  const [, startTransition] = useTransition();

  function save(next: { autoUse: boolean; order: TicketOrder }) {
    const prev = { autoUse, order };
    setAutoUse(next.autoUse);
    setOrder(next.order);
    startTransition(async () => {
      const r = await saveUsageSettings(next);
      if (!r.ok) {
        setAutoUse(prev.autoUse);
        setOrder(prev.order);
      }
    });
  }

  return (
    <div className="divide-y divide-border rounded-[28px] bg-white px-5">
      <div className="flex items-center justify-between py-4">
        <div className="min-w-0 pr-3">
          <p className="text-sm font-bold text-ink">초기화 티켓 자동 사용</p>
          <p className="text-xs text-ink-soft">사용량을 다 쓰면 티켓을 대신 써요</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoUse}
          aria-label="초기화 티켓 자동 사용"
          onClick={() => save({ autoUse: !autoUse, order })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${autoUse ? "bg-accent" : "bg-stone-200"}`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${autoUse ? "translate-x-6" : ""}`}
          />
        </button>
      </div>
      <div className={`flex items-center justify-between py-4 ${autoUse ? "" : "opacity-40"}`}>
        <p className="text-sm font-bold text-ink">티켓 사용 순서</p>
        <select
          value={order}
          disabled={!autoUse}
          onChange={(e) => save({ autoUse, order: e.target.value as TicketOrder })}
          className="rounded-full bg-surface px-3 py-2 text-sm font-semibold text-ink-soft outline-none"
        >
          <option value="half_first">절반 티켓 우선</option>
          <option value="full_first">전체 티켓 우선</option>
        </select>
      </div>
    </div>
  );
}

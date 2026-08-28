"use client";

import { useState, useTransition } from "react";
import {
  toggleRecurringExpenseActive,
  deleteRecurringExpense,
  logRecurringExpenseOccurrence,
} from "@/lib/actions/admin";
import { ConfirmModal } from "@/components/ConfirmModal";

export type RecurringExpense = {
  id: string;
  category: string;
  amount: number;
  memo: string | null;
  cycle: string;
  active: boolean;
};

function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => toggleRecurringExpenseActive(id, !active))}
      disabled={pending}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-60 ${
        active ? "bg-positive/10 text-positive-ink" : "bg-surface text-ink-faint"
      }`}
    >
      {active ? "사용중" : "중지됨"}
    </button>
  );
}

function LogButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await logRecurringExpenseOccurrence(id);
            if (res && "error" in res) setError(res.error);
          })
        }
        disabled={pending}
        className="rounded-lg border border-accent bg-white px-2.5 py-1.5 text-[11px] font-bold text-accent-ink disabled:opacity-60"
      >
        {pending ? "기록하는 중..." : "이번 주기 기록"}
      </button>
      {error && <p className="mt-1 text-[11px] text-warn-ink">{error}</p>}
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-ink-faint">
        삭제
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="이 정기 지출 항목을 삭제할까요?"
        description="이미 기록된 지출 내역은 그대로 남아요."
        confirmSlot={
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await deleteRecurringExpense(id);
                setOpen(false);
              })
            }
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제하는 중..." : "삭제"}
          </button>
        }
      />
    </>
  );
}

export function RecurringExpensesList({ items }: { items: RecurringExpense[] }) {
  if (items.length === 0) return <p className="text-sm text-ink-soft">등록된 정기 지출이 없어요.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
            <th className="px-3 py-2 font-semibold">카테고리</th>
            <th className="px-3 py-2 text-right font-semibold">금액</th>
            <th className="px-3 py-2 font-semibold">주기</th>
            <th className="px-3 py-2 font-semibold">메모</th>
            <th className="px-3 py-2 font-semibold">상태</th>
            <th className="w-32 px-3 py-2" />
            <th className="w-14 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
              <td className="px-3 py-2 font-bold">{r.category}</td>
              <td className="px-3 py-2 text-right">{r.amount.toLocaleString("ko-KR")}원</td>
              <td className="px-3 py-2 text-ink-soft">{r.cycle === "yearly" ? "매년" : "매월"}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-ink-soft">{r.memo}</td>
              <td className="px-3 py-2">
                <ToggleButton id={r.id} active={r.active} />
              </td>
              <td className="px-3 py-2">
                <LogButton id={r.id} />
              </td>
              <td className="px-3 py-2 text-right">
                <DeleteButton id={r.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

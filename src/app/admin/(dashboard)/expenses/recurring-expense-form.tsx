"use client";

import { useActionState } from "react";
import { createRecurringExpense } from "@/lib/actions/admin";

export function RecurringExpenseForm() {
  const [state, formAction, pending] = useActionState(createRecurringExpense, null);

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-white p-4">
      <p className="mb-3 text-sm font-bold">새 정기 지출 등록</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="category"
          placeholder="카테고리 (예: 서버 호스팅)"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="amount"
          type="number"
          step="1"
          min="0"
          placeholder="금액 (원)"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent sm:w-40"
        />
        <select
          name="cycle"
          defaultValue="monthly"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent sm:w-32"
        >
          <option value="monthly">매월</option>
          <option value="yearly">매년</option>
        </select>
      </div>
      <input
        name="memo"
        placeholder="메모 (선택)"
        className="mt-2 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="mt-2 text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? "등록하는 중..." : "정기 지출 등록"}
      </button>
    </form>
  );
}

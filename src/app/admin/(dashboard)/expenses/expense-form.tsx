"use client";

import { useActionState } from "react";
import { createExpense } from "@/lib/actions/admin";

const TODAY = new Date().toISOString().slice(0, 10);

export function ExpenseForm() {
  const [state, formAction, pending] = useActionState(createExpense, null);

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-white p-4">
      <p className="mb-3 text-sm font-bold">새 지출 등록</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="category"
          placeholder="카테고리 (예: AI API)"
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
        <input
          name="spentAt"
          type="date"
          defaultValue={TODAY}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent sm:w-44"
        />
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
        {pending ? "등록하는 중..." : "지출 등록"}
      </button>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { deleteExpense } from "@/lib/actions/admin";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          deleteExpense(expenseId);
        });
      }}
      disabled={pending}
      aria-label="삭제"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink-faint disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
}

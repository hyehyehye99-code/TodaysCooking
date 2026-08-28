"use client";

import { useActionState } from "react";
import { createPromoCode } from "@/lib/actions/admin";

export function NewPromoCodeForm() {
  const [state, formAction, pending] = useActionState(createPromoCode, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          name="code"
          required
          placeholder="코드 (예: WELCOME2026) *"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm uppercase outline-none focus:border-accent"
        />
        <input
          name="durationDays"
          type="number"
          min={1}
          placeholder="기간(일), 비우면 무제한"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <input
        name="note"
        placeholder="메모 (예: 인스타 이벤트용)"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "만드는 중..." : "코드 만들기"}
      </button>
    </form>
  );
}

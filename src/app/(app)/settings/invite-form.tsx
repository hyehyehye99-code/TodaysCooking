"use client";

import { useActionState } from "react";
import { createInvite } from "@/lib/actions/household";

export function InviteForm({ householdId }: { householdId: string }) {
  const [state, formAction, pending] = useActionState(createInvite, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="householdId" value={householdId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "만드는 중..." : "초대 코드 만들기"}
      </button>
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      {state?.code && (
        <div className="rounded-xl border border-transparent bg-surface px-4 py-3 text-center">
          <p className="text-[11px] text-ink-soft">이 코드를 상대방에게 알려주세요 (14일간 유효)</p>
          <p className="mt-1 text-2xl font-bold tracking-[0.2em]">{state.code}</p>
        </div>
      )}
    </form>
  );
}

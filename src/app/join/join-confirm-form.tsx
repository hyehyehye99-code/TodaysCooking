"use client";

import { useActionState } from "react";
import { joinHousehold } from "@/lib/actions/household";

export function JoinConfirmForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState(joinHousehold, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="code" value={code} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "참여하는 중..." : "참여하기"}
      </button>
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
    </form>
  );
}

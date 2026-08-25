"use client";

import { useActionState } from "react";
import { ClearableInput } from "@/components/ClearableInput";

export function CreateHouseholdForm({
  action,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <ClearableInput
        name="name"
        required
        placeholder="예) 혜동이네 집"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "만드는 중..." : "만들기"}
      </button>
    </form>
  );
}

export function JoinHouseholdForm({
  action,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <ClearableInput
        name="code"
        required
        placeholder="초대 코드 입력"
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm uppercase tracking-widest outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "참여하는 중..." : "참여하기"}
      </button>
    </form>
  );
}

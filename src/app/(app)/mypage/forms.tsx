"use client";

import { useActionState } from "react";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

export function CreateHouseholdForm({
  action,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <ClearableInput
        name="name"
        required
        placeholder={dict.onboarding.namePlaceholder}
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.mypage.creating : dict.mypage.create}
      </button>
    </form>
  );
}

export function JoinHouseholdForm({
  action,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <ClearableInput
        name="code"
        required
        placeholder={dict.mypage.inviteCodePlaceholder}
        className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm uppercase tracking-widest outline-none focus:border-accent"
      />
      {state?.error && <p className="text-xs text-warn-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.mypage.joining : dict.mypage.join}
      </button>
    </form>
  );
}

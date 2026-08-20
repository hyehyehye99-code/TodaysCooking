"use client";

import { FixedBottomBar } from "@/components/FixedBottomBar";

export function StickyFormBar({
  formId,
  pending,
  label,
  pendingLabel,
}: {
  formId: string;
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <FixedBottomBar>
      <button
        type="submit"
        form={formId}
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
    </FixedBottomBar>
  );
}

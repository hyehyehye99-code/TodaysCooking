"use client";

import { FixedBottomBar } from "@/components/FixedBottomBar";
import { Mascot } from "@/components/Mascot";

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
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-base font-bold text-white shadow-sm disabled:opacity-60"
      >
        {pending && <Mascot name="cooking" size={20} className="animate-icon-pulse" />}
        {pending ? pendingLabel : label}
      </button>
    </FixedBottomBar>
  );
}

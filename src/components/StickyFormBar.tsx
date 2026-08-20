"use client";

import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Rendered via a portal straight into document.body so it's a true
// viewport-fixed element, independent of any ancestor's scroll container or
// transform (PullToRefresh applies a translateY to the scroll area, which
// would otherwise turn position:fixed into something relative to that
// scrolling box instead of the viewport).
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] border-t border-border bg-white px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.15)]">
      <button
        type="submit"
        form={formId}
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
    </div>,
    document.body
  );
}

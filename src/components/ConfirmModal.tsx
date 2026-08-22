"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";

// Shared shell for the "are you sure?" modal pattern repeated across the
// app (delete recipe, remove member, leave household, delete account,
// bulk-delete, ...). Each call site still supplies its own confirm control
// (a plain button with onClick+useTransition, or a <form action={...}>) via
// `confirmSlot`, since that's the one part that genuinely differs between
// them; `children` is for any extra body content between the description
// and the button row (a typed-confirmation input, an error message, etc).
export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  children,
  cancelLabel = "취소",
  confirmSlot,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  cancelLabel?: string;
  confirmSlot: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} variant="center">
      <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-sm font-bold text-ink">{title}</p>
        {description && <p className="mt-2 text-xs text-ink-soft">{description}</p>}
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
          >
            {cancelLabel}
          </button>
          {confirmSlot}
        </div>
      </div>
    </Modal>
  );
}

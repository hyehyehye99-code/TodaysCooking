"use client";

import { useState } from "react";
import { NewCreatorForm } from "./new-creator-form";

export function NewCreatorSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-8 flex w-full items-center justify-between rounded-2xl border border-border bg-white p-4 text-sm font-bold"
      >
        <span>+ 새 크리에이터 추가</span>
        <span className="text-ink-faint">▾</span>
      </button>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">새 크리에이터</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-ink-faint">
          접기 ▴
        </button>
      </div>
      <NewCreatorForm />
    </div>
  );
}

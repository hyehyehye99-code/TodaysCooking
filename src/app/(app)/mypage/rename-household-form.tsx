"use client";

import { useState, useTransition } from "react";
import { renameHousehold } from "@/lib/actions/household";

export function RenameHouseholdForm({
  householdId,
  currentName,
}: {
  householdId: string;
  currentName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setEditing(true);
        }}
        className="text-xs font-bold text-ink-faint underline"
      >
        이름 바꾸기
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await renameHousehold(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="householdId" value={householdId} />
      <div className="flex gap-2">
        <input
          name="name"
          required
          autoFocus
          defaultValue={currentName}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="shrink-0 rounded-lg bg-surface px-3 py-2 text-xs font-bold text-ink-soft"
        >
          취소
        </button>
      </div>
      {error && <p className="text-xs text-warn-ink">{error}</p>}
    </form>
  );
}

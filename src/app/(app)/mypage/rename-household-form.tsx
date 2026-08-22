"use client";

import { useState, useTransition } from "react";
import { renameHousehold } from "@/lib/actions/household";
import { ClearableInput } from "@/components/ClearableInput";

export function RenameHouseholdForm({
  householdId,
  currentName,
  onSuccess,
}: {
  householdId: string;
  currentName: string;
  onSuccess?: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    startTransition(async () => {
      const result = await renameHousehold(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        setError(null);
        setSuccess(true);
        onSuccess?.();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="householdId" value={householdId} />
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <ClearableInput
            name="name"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
      {error && <p className="text-xs text-warn-ink">{error}</p>}
      {success && <p className="text-xs text-positive-ink">이름을 저장했어요.</p>}
    </form>
  );
}

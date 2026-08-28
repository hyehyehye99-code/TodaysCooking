"use client";

import { useState, useTransition } from "react";
import { addSharedRecipeToHousehold } from "@/lib/actions/sharing";

export function AddSharedRecipeButton({ code }: { code: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addSharedRecipeToHousehold(code);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "추가하는 중..." : "우리집 레시피에 추가하기"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

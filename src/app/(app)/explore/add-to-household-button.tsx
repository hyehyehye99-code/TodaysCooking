"use client";

import { useState, useTransition } from "react";
import { addExploreRecipeToHousehold } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";

export function AddToHouseholdButton({ source, id }: { source: "creator" | "personal"; id: string }) {
  const dict = useDict();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addExploreRecipeToHousehold(source, id);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? dict.explore.addingToMyRecipes : dict.explore.addToMyRecipes}
      </button>
      {error && <p className="mt-2 text-center text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

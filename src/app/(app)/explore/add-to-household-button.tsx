"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addExploreRecipeToHousehold } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";

export function AddToHouseholdButton({
  source,
  id,
  initialAddedRecipeId = null,
}: {
  source: "creator" | "personal";
  id: string;
  initialAddedRecipeId?: string | null;
}) {
  const dict = useDict();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addedRecipeId, setAddedRecipeId] = useState<string | null>(initialAddedRecipeId);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addExploreRecipeToHousehold(source, id);
      if (!result) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAddedRecipeId(result.recipeId);
    });
  }

  if (addedRecipeId) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3.5">
        <span className="flex items-center gap-1.5 text-sm font-bold text-accent-ink">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L19 7" />
          </svg>
          {dict.explore.addedToMyRecipes}
        </span>
        <Link href={`/recipes/${addedRecipeId}`} className="text-xs font-bold text-accent-ink underline">
          {dict.explore.viewInMyRecipes}
        </Link>
      </div>
    );
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
      {error && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="text-center text-xs text-warn-ink">{error}</p>
        </div>
      )}
    </div>
  );
}

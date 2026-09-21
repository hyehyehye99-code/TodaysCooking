"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCookingRecipe } from "@/lib/actions/recipes";
import * as guestStore from "@/lib/guest/store";
import { useDict } from "@/lib/i18n/client";

export function CookingToggleButton({
  recipeId,
  isCooking,
  guest = false,
}: {
  recipeId: string;
  isCooking: boolean;
  guest?: boolean;
}) {
  const dict = useDict();
  const [optimisticCooking, setOptimisticCooking] = useOptimistic(isCooking);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const next = !optimisticCooking;
        if (guest) {
          guestStore.toggleCooking(recipeId, next);
          return;
        }
        startTransition(async () => {
          setOptimisticCooking(next);
          await toggleCookingRecipe(recipeId, next);
          router.refresh();
        });
      }}
      className={`mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold ${
        optimisticCooking ? "bg-accent text-white" : "border border-dashed border-border text-accent"
      }`}
    >
      {optimisticCooking ? (
        <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 7.5l3 3 6-7" />
        </svg>
      ) : (
        "🍳"
      )}
      {optimisticCooking ? dict.recipes.stopCooking : dict.recipes.startCooking}
    </button>
  );
}

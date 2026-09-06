"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMealPlanIngredientsToShopping } from "@/lib/actions/meal-plans";
import { useDict } from "@/lib/i18n/client";

export function AddMissingButton({ mealPlanId, missingNames }: { mealPlanId: string; missingNames: string[] }) {
  const dict = useDict();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (missingNames.length === 0) {
    return <p className="text-center text-[13px] font-bold text-positive-ink">{dict.mealPlan.allReadyMessage}</p>;
  }

  function handleClick() {
    startTransition(async () => {
      await addMealPlanIngredientsToShopping(mealPlanId, missingNames);
      setDone(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || done}
      className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
    >
      {done
        ? dict.mealPlan.addedToShoppingMessage
        : pending
          ? dict.recipes.addingEllipsis
          : dict.mealPlan.addMissingButtonTemplate.replace("{count}", String(missingNames.length))}
    </button>
  );
}

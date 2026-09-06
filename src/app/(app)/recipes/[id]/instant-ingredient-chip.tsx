"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState } from "@/lib/actions/recipes";
import { IngredientChip, type IngredientChipState } from "@/components/IngredientChip";

// The recipe detail page's own chips save on every tap (unlike a meal
// plan's buffered + "저장" flow) — this wrapper owns that instant-save
// behavior so IngredientChip itself can stay a plain controlled component.
export function InstantIngredientChip({
  recipeId,
  name,
  amount,
  initialState,
}: {
  recipeId: string;
  name: string;
  amount: string | null;
  initialState: IngredientChipState;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic<IngredientChipState, IngredientChipState>(
    initialState,
    (_prev, next) => next
  );

  function handleChange(next: IngredientChipState) {
    startTransition(async () => {
      setState(next);
      await setIngredientState(recipeId, name, next);
      router.refresh();
    });
  }

  return <IngredientChip name={name} amount={amount} state={state} onChange={handleChange} />;
}

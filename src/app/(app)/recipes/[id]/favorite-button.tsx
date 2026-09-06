"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavoriteRecipe } from "@/lib/actions/recipes";
import { useDict } from "@/lib/i18n/client";

export function FavoriteButton({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) {
  const dict = useDict();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const next = !optimisticFavorite;
        startTransition(async () => {
          setOptimisticFavorite(next);
          await toggleFavoriteRecipe(recipeId, next);
          router.refresh();
        });
      }}
      aria-label={dict.recipes.favorite}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={optimisticFavorite ? "var(--color-warn)" : "none"}
        stroke={optimisticFavorite ? "var(--color-warn)" : "var(--color-ink-faint)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    </button>
  );
}

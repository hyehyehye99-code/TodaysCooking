"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { setRecipePublic } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";

export type MyRecipe = {
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  is_public: boolean;
};

function PublicToggle({ recipe }: { recipe: MyRecipe }) {
  const dict = useDict();
  const [optimisticPublic, setOptimisticPublic] = useOptimistic(recipe.is_public);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !optimisticPublic;
    startTransition(async () => {
      setOptimisticPublic(next);
      await setRecipePublic(recipe.id, next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
        optimisticPublic ? "bg-accent text-white" : "bg-surface text-ink-soft"
      }`}
    >
      {optimisticPublic ? dict.explore.publicOn : dict.explore.publicOff}
    </button>
  );
}

export function MyRecipesList({ recipes }: { recipes: MyRecipe[] }) {
  const dict = useDict();

  if (recipes.length === 0) {
    return <p className="mt-10 text-center text-sm text-ink-soft">{dict.recipes.emptyNoRecipes}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {recipes.map((recipe) => (
        <GlassCard key={recipe.id} className="flex items-center gap-3 bg-white p-3.5">
          <RecipeThumb coverPhotoUrl={recipe.cover_photo_urls[0]} iconEmoji={recipe.icon_emoji} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold">{recipe.title || dict.recipes.untitledLink}</p>
            {recipe.subtitle && <p className="mt-0.5 truncate text-xs text-ink-soft">{recipe.subtitle}</p>}
          </div>
          <PublicToggle recipe={recipe} />
        </GlassCard>
      ))}
    </div>
  );
}

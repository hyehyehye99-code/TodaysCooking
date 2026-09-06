import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { IngredientChip, type IngredientChipState } from "@/components/IngredientChip";

type Ingredient = { name: string; amount: string | null; initialState: IngredientChipState };

export function MealPlanRecipeCard({
  index,
  recipeId,
  mealPlanId,
  title,
  untitledLabel,
  coverPhotoUrl,
  iconEmoji,
  linkThumbnailUrl,
  ingredients,
}: {
  index: number;
  recipeId: string;
  mealPlanId: string;
  title: string | null;
  untitledLabel: string;
  coverPhotoUrl?: string;
  iconEmoji: string | null;
  linkThumbnailUrl?: string | null;
  ingredients: Ingredient[];
}) {
  return (
    <GlassCard className="bg-white p-3.5">
      <Link
        href={`/recipes/${recipeId}?from=${encodeURIComponent(`/explore/${mealPlanId}`)}`}
        className="mb-2.5 flex items-center gap-2.5"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-ink-soft">
          {index + 1}
        </span>
        <RecipeThumb
          coverPhotoUrl={coverPhotoUrl}
          iconEmoji={iconEmoji}
          linkThumbnailUrl={linkThumbnailUrl}
          size={36}
          rounded="rounded-lg"
        />
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{title || untitledLabel}</span>
      </Link>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <IngredientChip
              key={ing.name}
              recipeId={recipeId}
              name={ing.name}
              amount={ing.amount}
              initialState={ing.initialState}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

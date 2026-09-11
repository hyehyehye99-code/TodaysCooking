import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { IngredientChip, type IngredientChipState } from "@/components/IngredientChip";

type Ingredient = { name: string; amount: string | null; state: IngredientChipState };

export function MealPlanRecipeCard({
  index,
  recipeId,
  mealPlanId,
  title,
  displayName,
  untitledLabel,
  coverPhotoUrl,
  iconEmoji,
  linkThumbnailUrl,
  ingredients,
  onIngredientChange,
}: {
  index: number;
  recipeId: string;
  mealPlanId: string;
  title: string | null;
  displayName: string | null;
  untitledLabel: string;
  coverPhotoUrl?: string;
  iconEmoji: string | null;
  linkThumbnailUrl?: string | null;
  ingredients: Ingredient[];
  onIngredientChange: (name: string, next: IngredientChipState) => void;
}) {
  const effectiveTitle = displayName || title || untitledLabel;

  return (
    <GlassCard className="bg-white p-3.5">
      <Link
        href={`/recipes/${recipeId}?from=${encodeURIComponent(`/explore/${mealPlanId}`)}`}
        className="mb-2.5 flex items-center gap-3"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-ink">
          {index + 1}
        </span>
        <RecipeThumb
          coverPhotoUrl={coverPhotoUrl}
          iconEmoji={iconEmoji}
          linkThumbnailUrl={linkThumbnailUrl}
          size={40}
          rounded="rounded-xl"
        />
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{effectiveTitle}</span>
      </Link>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <IngredientChip
              key={ing.name}
              name={ing.name}
              amount={ing.amount}
              state={ing.state}
              onChange={(next) => onIngredientChange(ing.name, next)}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

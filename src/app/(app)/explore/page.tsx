import Link from "next/link";
import { getCurrentHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { getDictionary } from "@/lib/i18n/server";

type RecipeThumbFields = {
  cover_photo_urls: string[];
  icon_emoji: string | null;
  bookmarks: { thumbnail_url: string | null }[] | null;
};

type MealPlanRow = {
  id: string;
  title: string;
  meal_plan_recipes: {
    position: number;
    recipes: RecipeThumbFields | RecipeThumbFields[] | null;
  }[];
};

function firstThumb(mealPlan: MealPlanRow) {
  const first = [...mealPlan.meal_plan_recipes].sort((a, b) => a.position - b.position)[0];
  if (!first) return null;
  const recipe = Array.isArray(first.recipes) ? (first.recipes[0] ?? null) : first.recipes;
  return recipe;
}

export default async function ExplorePage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select(
      "id, title, meal_plan_recipes(position, recipes(cover_photo_urls, icon_emoji, bookmarks(thumbnail_url)))"
    )
    .eq("household_id", household!.id)
    .order("created_at", { ascending: false });

  const plans = (mealPlans as MealPlanRow[] | null) ?? [];

  return (
    <div>
      {plans.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-faint">{dict.mealPlan.emptyState}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {plans.map((plan) => {
            const thumb = firstThumb(plan);
            const count = plan.meal_plan_recipes.length;
            return (
              <Link key={plan.id} href={`/explore/${plan.id}`}>
                <GlassCard className="flex items-center gap-3 bg-white p-3">
                  <RecipeThumb
                    coverPhotoUrl={thumb?.cover_photo_urls[0]}
                    iconEmoji={thumb?.icon_emoji}
                    linkThumbnailUrl={thumb?.bookmarks?.[0]?.thumbnail_url}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{plan.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {dict.mealPlan.recipeCountTemplate.replace("{count}", String(count))}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

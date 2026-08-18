import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { RecipeList } from "./recipe-list";
import type { RecipeWithIngredients } from "@/lib/types";

export default async function RecipesPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [{ data: recipes }, { data: fridgeItems }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("household_id", household!.id)
      .order("is_favorite", { ascending: false })
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
  ]);

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const items = (recipes as RecipeWithIngredients[] | null) ?? [];
  const makeableCount = items.filter((r) =>
    r.recipe_ingredients.every((ing) => owned.has(ing.name))
  ).length;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <PageHeader title="레시피" />
        <Link href="/recipes/new" className="text-sm font-bold text-accent">
          + 새 레시피
        </Link>
      </div>

      <GlassCard className="mb-4 border-transparent bg-surface px-4 py-3.5">
        <p className="text-sm font-bold text-accent-ink">
          지금 만들 수 있는 레시피 {makeableCount}개
        </p>
      </GlassCard>

      <RecipeList recipes={items} />
    </div>
  );
}

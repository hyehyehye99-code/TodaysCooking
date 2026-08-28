import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { RecipeList } from "./recipe-list";
import type { RecipeWithIngredients } from "@/lib/types";

export default async function RecipesPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [{ data: recipes }, { data: fridgeItems }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*), bookmarks(url, title, domain, thumbnail_url)")
      .eq("household_id", household!.id)
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
  ]);

  const owned = (fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name);
  const items = (recipes as RecipeWithIngredients[] | null) ?? [];

  return (
    <div>
      <RecipeList recipes={items} ownedIngredients={owned} />
    </div>
  );
}

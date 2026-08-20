import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { NewRecipeForm } from "./new-recipe-form";

export default async function NewRecipePage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [{ data: tagRows }, { data: fridgeRows }] = await Promise.all([
    supabase.from("recipes").select("tags").eq("household_id", household!.id),
    supabase.from("fridge_items").select("name").eq("household_id", household!.id),
  ]);

  const existingTags = [...new Set((tagRows ?? []).flatMap((r) => r.tags ?? []))].sort();
  const fridgeItems = [...new Set((fridgeRows ?? []).map((f) => f.name))].sort();

  return <NewRecipeForm existingTags={existingTags} fridgeItems={fridgeItems} />;
}

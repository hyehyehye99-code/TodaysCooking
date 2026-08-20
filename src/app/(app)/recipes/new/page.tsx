import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { NewRecipeForm } from "./new-recipe-form";

export default async function NewRecipePage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select("tags")
    .eq("household_id", household!.id);

  const existingTags = [...new Set((data ?? []).flatMap((r) => r.tags ?? []))].sort();

  return <NewRecipeForm existingTags={existingTags} />;
}

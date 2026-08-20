import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecipeWithIngredients } from "@/lib/types";
import { EditRecipeForm } from "./edit-recipe-form";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recipe }, { data: referenceBookmark }] = await Promise.all([
    supabase.from("recipes").select("*, recipe_ingredients(*)").eq("id", id).single(),
    supabase.from("bookmarks").select("url").eq("recipe_id", id).maybeSingle(),
  ]);

  if (!recipe) notFound();

  const { data: tagRows } = await supabase
    .from("recipes")
    .select("tags")
    .eq("household_id", recipe.household_id);
  const existingTags = [...new Set((tagRows ?? []).flatMap((r) => r.tags ?? []))].sort();

  return (
    <EditRecipeForm
      recipe={recipe as RecipeWithIngredients}
      referenceUrl={referenceBookmark?.url ?? ""}
      existingTags={existingTags}
    />
  );
}

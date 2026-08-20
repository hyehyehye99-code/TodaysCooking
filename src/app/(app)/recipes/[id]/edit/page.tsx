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

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  // tagRows depends on recipe.household_id, so it can't start until the
  // recipe query resolves — but referenceBookmark doesn't depend on either,
  // so run it alongside instead of after.
  const [{ data: referenceBookmark }, { data: tagRows }] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("url, title, thumbnail_url, domain")
      .eq("recipe_id", id)
      .maybeSingle(),
    supabase.from("recipes").select("tags").eq("household_id", recipe.household_id),
  ]);
  const existingTags = [...new Set((tagRows ?? []).flatMap((r) => r.tags ?? []))].sort();

  return (
    <EditRecipeForm
      recipe={recipe as RecipeWithIngredients}
      referenceUrl={referenceBookmark?.url ?? ""}
      referencePreview={
        referenceBookmark
          ? {
              title: referenceBookmark.title,
              thumbnailUrl: referenceBookmark.thumbnail_url,
              domain: referenceBookmark.domain,
            }
          : null
      }
      existingTags={existingTags}
    />
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export type ExploreSearchResult = {
  source: "creator" | "personal";
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  creator_id: string | null;
  creator_name: string;
  creator_icon_emoji: string | null;
  add_count: number;
  created_at: string;
};

export async function searchExploreRecipes(query: string): Promise<ExploreSearchResult[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_explore_recipes", { p_query: query });
  return (data as ExploreSearchResult[] | null) ?? [];
}

export async function setRecipePublic(recipeId: string, isPublic: boolean) {
  const supabase = await createClient();
  await supabase.from("recipes").update({ is_public: isPublic }).eq("id", recipeId);
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/edit`);
}

type ExploreIngredient = { name: string; amount: string | null };

type ExploreRecipeSource = {
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  ingredients: ExploreIngredient[];
  creator_name: string;
};

// Copies a public Explore recipe (from either source) into the caller's own
// household as a brand new recipe — a one-time fork, not a live link back
// to the original, same as how a person would otherwise just retype it.
export async function addExploreRecipeToHousehold(
  source: "creator" | "personal",
  id: string
) {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();

  const { data, error } = (await supabase
    .rpc(source === "creator" ? "get_creator_recipe" : "get_public_recipe", { p_id: id })
    .maybeSingle()) as { data: ExploreRecipeSource | null; error: unknown };
  if (error || !data) return { error: "레시피를 불러오지 못했어요." };

  const { data: topRecipe } = await supabase
    .from("recipes")
    .select("position")
    .eq("household_id", household.id)
    .order("position", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const newPosition = (topRecipe?.position ?? 0) - 1;

  const { data: recipe, error: insertError } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      title: data.title,
      subtitle: data.subtitle,
      cover_photo_urls: data.cover_photo_urls,
      icon_emoji: data.icon_emoji,
      tags: data.tags,
      notes: data.notes,
      source_creator_name: data.creator_name,
      created_by: user.id,
      position: newPosition,
    })
    .select("id")
    .single();
  if (insertError || !recipe) return { error: "레시피를 추가하지 못했어요." };

  const ingredients = data.ingredients ?? [];
  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, position: i }))
    );
  }

  // "맛있다고 표현했어요!" on the original is just this counter — adding it
  // to your own recipes IS the compliment, no separate reaction needed.
  await supabase.rpc(
    source === "creator" ? "increment_creator_recipe_add_count" : "increment_recipe_explore_add_count",
    { p_id: id }
  );

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

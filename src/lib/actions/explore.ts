"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

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
  source_url: string | null;
};

// Copies a public Explore recipe (from either source) into the caller's own
// Looks up whether the current household already has its own copy of a
// given explore recipe, so the "추가하기" button can show its already-added
// state on load instead of only after a click in the same session.
export async function findHouseholdCopyOfExploreRecipe(
  source: "creator" | "personal",
  id: string
): Promise<string | null> {
  const { household } = await getCurrentHousehold();
  if (!household) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("household_id", household.id)
    .eq("source_type", source)
    .eq("source_id", id)
    .maybeSingle();
  return data?.id ?? null;
}

// household as a brand new recipe — a one-time fork, not a live link back
// to the original, same as how a person would otherwise just retype it.
// Idempotent: pressing it again for the same household just returns the
// existing copy instead of creating a duplicate (see the unique index on
// recipes(household_id, source_type, source_id)).
//
// Free households cap out at FREE_WEEKLY_LIMIT adds per rolling week — same
// shape as the AI recipe quota in ai-recipe.ts (promo redemption or an
// active subscription lifts the cap entirely, checked in that order).
const FREE_WEEKLY_LIMIT = 5;

export async function addExploreRecipeToHousehold(
  source: "creator" | "personal",
  id: string
): Promise<{ error: string; limitReached?: boolean } | { recipeId: string }> {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();

  const existing = await findHouseholdCopyOfExploreRecipe(source, id);
  if (existing) return { recipeId: existing };

  const { data: promoGrant } = await supabase
    .from("promo_code_redemptions")
    .select("expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  let isUnlimited = !!promoGrant && (!promoGrant.expires_at || new Date(promoGrant.expires_at) > new Date());

  if (!isUnlimited) {
    const { data: sub } = await supabase
      .from("household_subscriptions")
      .select("active, expires_at")
      .eq("household_id", household.id)
      .maybeSingle();
    isUnlimited = !!sub?.active && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  }

  if (!isUnlimited) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("household_id", household.id)
      .not("source_type", "is", null)
      .gte("created_at", since);
    if ((count ?? 0) >= FREE_WEEKLY_LIMIT) {
      return {
        error: `이번 주 무료로 추가할 수 있는 레시피(${FREE_WEEKLY_LIMIT}개)를 다 썼어요. 구독하면 무제한으로 추가할 수 있어요.`,
        limitReached: true,
      };
    }
  }

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
      source_type: source,
      source_id: id,
      created_by: user.id,
      position: newPosition,
    })
    .select("id")
    .single();
  if (insertError) {
    // A concurrent click from the same household raced us past the check
    // above — the unique index caught it, so fetch what that insert landed
    // instead of surfacing a confusing duplicate-key error.
    const raced = await findHouseholdCopyOfExploreRecipe(source, id);
    if (raced) return { recipeId: raced };
    return { error: "레시피를 추가하지 못했어요." };
  }
  if (!recipe) return { error: "레시피를 추가하지 못했어요." };

  const ingredients = data.ingredients ?? [];
  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, position: i }))
    );
  }

  // Give the copy a bookmarks row pointing at the source video, the same
  // shape saveReferenceLink (recipes.ts) creates for a manually-pasted
  // reference link — the recipe detail page already renders that as a
  // thumbnail+title link card, so this is the only piece needed to make a
  // creator-recipe copy look like one instead of showing the video
  // thumbnail as a fake hero photo. Best-effort: a failed fetch just means
  // no card, not a failed copy.
  if (source === "creator" && data.source_url) {
    const preview = await fetchLinkPreview(data.source_url);
    if (preview.ok) {
      await supabase.from("bookmarks").insert({
        household_id: household.id,
        url: preview.url,
        title: preview.title,
        domain: preview.domain,
        thumbnail_url: preview.thumbnailUrl,
        recipe_id: recipe.id,
        created_by: user.id,
      });
    }
  }

  // The count shown on the original is just this counter — adding it to
  // your own recipes IS the compliment, no separate reaction needed.
  await supabase.rpc(
    source === "creator" ? "increment_creator_recipe_add_count" : "increment_recipe_explore_add_count",
    { p_id: id }
  );

  revalidatePath("/recipes");
  return { recipeId: recipe.id };
}

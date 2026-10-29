import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { loadCustomIngredientRules, parseIngredients } from "@/lib/ingredientParsing";
import { pickDishEmoji } from "@/lib/assistant/dish-emoji";
import type { AssistantIdea, AssistantRecipeCard } from "@/lib/assistant/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type HouseholdRecipe = {
  id: string;
  title: string | null;
  subtitle: string | null;
  icon_emoji: string | null;
  tags: string[];
  recipe_ingredients: { name: string }[];
};

export type KitchenContext = {
  recipes: HouseholdRecipe[];
  owned: string[];
};

export async function loadKitchenContext(supabase: Supabase, householdId: string): Promise<KitchenContext> {
  const [{ data: recipes }, { data: fridge }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, subtitle, icon_emoji, tags, recipe_ingredients(name)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase.from("fridge_items").select("name").eq("household_id", householdId).eq("in_stock", true),
  ]);
  return {
    recipes: (recipes as HouseholdRecipe[] | null) ?? [],
    owned: (fridge ?? []).map((f) => f.name),
  };
}

// "두부" in the fridge should count for "연두부" / "두부 반 모" style names too.
function isOwned(ingredient: string, owned: string[]) {
  return owned.some((o) => ingredient.includes(o) || o.includes(ingredient));
}

export function toRecipeCard(recipe: HouseholdRecipe, owned: string[]): AssistantRecipeCard {
  const names = recipe.recipe_ingredients.map((i) => i.name);
  const title = recipe.title ?? "이름 없는 레시피";
  return {
    id: recipe.id,
    title,
    emoji: recipe.icon_emoji ?? pickDishEmoji(`${title} ${recipe.tags.join(" ")}`),
    summary: recipe.subtitle ?? recipe.tags.slice(0, 3).join(" · "),
    ingredients: names.slice(0, 6),
    ownedCount: names.filter((n) => isOwned(n, owned)).length,
    totalCount: names.length,
  };
}

export function missingIngredients(ingredients: string[], owned: string[]) {
  return ingredients.filter((n) => !isOwned(n, owned));
}

// Same insert sequence as createRecipe in actions/recipes.ts (new recipes sort
// to the top via a position below the current minimum), minus the form/redirect
// plumbing — the assistant saves from a structured object, not a form.
export async function saveRecipeForHousehold(
  supabase: Supabase,
  ctx: { householdId: string; userId: string },
  input: AssistantIdea & { referenceUrl?: string }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ingredients = parseIngredients(
    input.ingredients.map((i) => (i.amount ? `${i.name} ${i.amount}` : i.name)).join("\n"),
    await loadCustomIngredientRules(supabase)
  );
  if (ingredients.length === 0) return { ok: false, error: "재료가 비어 있어요." };

  const { data: top } = await supabase
    .from("recipes")
    .select("position")
    .eq("household_id", ctx.householdId)
    .order("position", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: ctx.householdId,
      title: input.title,
      subtitle: input.summary || null,
      cover_photo_urls: [],
      // Never auto-assign an icon: it outranks the link thumbnail in
      // RecipeThumb, and a user who wants one picks it themselves.
      icon_emoji: null,
      tags: input.tags,
      notes: input.instructions || null,
      hide_ingredients: false,
      created_by: ctx.userId,
      position: (top?.position ?? 0) - 1,
    })
    .select("id")
    .single();
  if (error || !recipe) return { ok: false, error: "레시피를 저장하지 못했어요." };

  const { error: ingError } = await supabase.from("recipe_ingredients").insert(
    ingredients.map((ing, i) => ({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, position: i }))
  );
  if (ingError) {
    await supabase.from("recipes").delete().eq("id", recipe.id);
    return { ok: false, error: "재료를 저장하지 못했어요." };
  }

  if (input.referenceUrl) {
    const preview = await fetchLinkPreview(input.referenceUrl);
    if (preview.ok) {
      await supabase.from("bookmarks").insert({
        household_id: ctx.householdId,
        url: preview.url,
        title: preview.title,
        domain: preview.domain,
        thumbnail_url: preview.thumbnailUrl,
        recipe_id: recipe.id,
        created_by: ctx.userId,
      });
    }
  }

  return { ok: true, id: recipe.id };
}

// Skips anything already on the unchecked list, so tapping the chip twice
// doesn't duplicate rows.
export async function addShoppingItems(supabase: Supabase, householdId: string, names: string[]) {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 40);
  if (wanted.length === 0) return { added: 0 };

  const { data: existing } = await supabase
    .from("shopping_items")
    .select("name")
    .eq("household_id", householdId)
    .eq("checked", false);
  const have = new Set((existing ?? []).map((e) => e.name));
  const fresh = wanted.filter((n) => !have.has(n));
  if (fresh.length === 0) return { added: 0 };

  const { error } = await supabase
    .from("shopping_items")
    .insert(fresh.map((name) => ({ household_id: householdId, name })));
  return error ? { added: 0, error: true as const } : { added: fresh.length };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { uploadRecipePhotos } from "@/lib/actions/storage";
import { CATEGORY_BY_INGREDIENT_NAME } from "@/lib/ingredients";
import { MAX_RECIPE_PHOTOS } from "@/lib/constants";

// Receives what a guest kept on their device (see lib/guest/store.ts) after
// they log in. Nothing here trusts the payload: it comes from localStorage,
// so every field is re-validated and length-capped, and it only ever writes
// into the caller's own current household.

type ImportedRecipe = {
  title: string | null;
  subtitle: string | null;
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  hide_ingredients: boolean;
  is_favorite: boolean;
  ingredients: { name: string; amount: string | null }[];
  reference: { url: string; title: string | null; domain: string | null; thumbnail_url: string | null } | null;
};

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function sanitizeRecipe(raw: unknown): ImportedRecipe | null {
  const r = raw as Partial<ImportedRecipe> | null;
  if (!r || typeof r !== "object") return null;

  const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
    .slice(0, 100)
    .map((i) => ({ name: str(i?.name, 100), amount: str(i?.amount, 100) }))
    .filter((i): i is { name: string; amount: string | null } => !!i.name);

  const ref = r.reference;
  const refUrl = ref && typeof ref === "object" ? str(ref.url, 2000) : null;

  return {
    title: str(r.title, 200),
    subtitle: str(r.subtitle, 300),
    icon_emoji: str(r.icon_emoji, 16),
    tags: (Array.isArray(r.tags) ? r.tags : []).map((t) => str(t, 40)).filter((t): t is string => !!t).slice(0, 30),
    notes: str(r.notes, 20000),
    hide_ingredients: r.hide_ingredients === true,
    is_favorite: r.is_favorite === true,
    ingredients,
    reference: refUrl
      ? {
          url: refUrl,
          title: str(ref?.title, 300),
          domain: str(ref?.domain, 200),
          thumbnail_url: str(ref?.thumbnail_url, 2000),
        }
      : null,
  };
}

export async function importGuestRecipe(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "로그인이 필요해요." };

  let recipe: ImportedRecipe | null = null;
  try {
    recipe = sanitizeRecipe(JSON.parse(String(formData.get("data") ?? "null")));
  } catch {
    recipe = null;
  }
  if (!recipe) return { error: "레시피 정보를 읽지 못했어요." };

  const supabase = await createClient();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_RECIPE_PHOTOS);
  let photoUrls: string[] = [];
  if (files.length > 0) {
    const uploaded = await uploadRecipePhotos(supabase, household.id, files);
    if ("error" in uploaded) return { error: uploaded.error };
    photoUrls = uploaded.urls;
  }

  // Same "one above the current top" placement createRecipe() uses.
  const { data: top } = await supabase
    .from("recipes")
    .select("position")
    .eq("household_id", household.id)
    .order("position", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      title: recipe.title,
      subtitle: recipe.subtitle,
      cover_photo_urls: photoUrls,
      icon_emoji: recipe.icon_emoji,
      tags: recipe.tags,
      notes: recipe.notes,
      hide_ingredients: recipe.hide_ingredients,
      is_favorite: recipe.is_favorite,
      created_by: user.id,
      position: (top?.position ?? 0) - 1,
    })
    .select("id")
    .single();
  if (error || !created) return { error: "레시피를 옮기지 못했어요." };

  if (recipe.ingredients.length > 0) {
    const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(
      recipe.ingredients.map((ing, i) => ({ recipe_id: created.id, name: ing.name, amount: ing.amount, position: i }))
    );
    if (ingredientsError) {
      await supabase.from("recipes").delete().eq("id", created.id);
      return { error: "재료를 옮기지 못했어요." };
    }
  }

  if (recipe.reference) {
    await supabase.from("bookmarks").insert({
      household_id: household.id,
      url: recipe.reference.url,
      title: recipe.reference.title,
      domain: recipe.reference.domain,
      thumbnail_url: recipe.reference.thumbnail_url,
      recipe_id: created.id,
      created_by: user.id,
    });
  }

  revalidatePath("/recipes");
  return { ok: true };
}

// The guest's shopping list and fridge. Whatever the account already has wins:
// a name that's already on the list, or already tracked in the fridge, is left
// exactly as it is rather than overwritten by stale local data.
export async function importGuestLists(payload: {
  shopping: { name: string; checked: boolean; source_recipe_title: string | null }[];
  fridge: { name: string; category: string; in_stock: boolean }[];
}): Promise<{ ok: true } | { error: string }> {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "로그인이 필요해요." };

  const supabase = await createClient();

  const shopping = (Array.isArray(payload?.shopping) ? payload.shopping : [])
    .slice(0, 500)
    .map((s) => ({ name: str(s?.name, 100), checked: s?.checked === true, source: str(s?.source_recipe_title, 300) }))
    .filter((s): s is { name: string; checked: boolean; source: string | null } => !!s.name);

  const fridge = (Array.isArray(payload?.fridge) ? payload.fridge : [])
    .slice(0, 1000)
    .map((f) => ({
      name: str(f?.name, 100),
      category: str(f?.category, 50) ?? "미분류",
      in_stock: f?.in_stock === true,
    }))
    .filter((f): f is { name: string; category: string; in_stock: boolean } => !!f.name);

  if (shopping.length > 0) {
    const { data: existing } = await supabase.from("shopping_items").select("name").eq("household_id", household.id);
    const have = new Set((existing ?? []).map((s) => s.name));
    const rows = shopping
      .filter((s) => !have.has(s.name))
      .map((s) => ({
        household_id: household.id,
        name: s.name,
        checked: s.checked,
        source_recipe_title: s.source,
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from("shopping_items").insert(rows);
      if (error) return { error: "장보기 목록을 옮기지 못했어요." };
    }
  }

  if (fridge.length > 0) {
    const { error } = await supabase.from("fridge_items").upsert(
      fridge.map((f) => ({
        household_id: household.id,
        name: f.name,
        category: f.category || CATEGORY_BY_INGREDIENT_NAME.get(f.name) || "미분류",
        in_stock: f.in_stock,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "household_id,name", ignoreDuplicates: true }
    );
    if (error) return { error: "냉장고를 옮기지 못했어요." };
  }

  revalidatePath("/shopping");
  revalidatePath("/mypage/fridge");
  revalidatePath("/recipes");
  return { ok: true };
}

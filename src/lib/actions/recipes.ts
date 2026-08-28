"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { uploadRecipePhotos } from "@/lib/actions/storage";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { notifyHousehold } from "@/lib/actions/activity";
import { MAX_RECIPE_PHOTOS } from "@/lib/constants";

async function getNickname(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("nickname").eq("id", userId).maybeSingle();
  return data?.nickname ?? "누군가";
}

// Common amount-only words that carry no digit, so the digit check below
// wouldn't catch them on their own — e.g. "고추장 듬뿍" should split into
// name "고추장" + amount "듬뿍", not get stuck as one unsplit blob (which
// then fails to match "고추장" in the fridge/shopping list by exact name).
const QUANTITY_ONLY_WORDS = new Set([
  "약간", "적당량", "적당히", "조금", "조금씩", "약간씩", "약간만",
  "넉넉히", "넉넉하게", "듬뿍", "듬뿍씩", "많이", "충분히",
  "소량", "소량씩", "한꼬집", "한꼬집씩", "한줌", "한줌씩",
  "한스푼", "한큰술", "한작은술", "한컵", "한주먹",
]);

// Unit suffixes that make a trailing token look like an amount even without
// a digit or an exact QUANTITY_ONLY_WORDS match (e.g. "두어스푼", "몇큰술").
// "장" is deliberately excluded — 고추장/된장/쌈장/간장 (whole 장류 category)
// would falsely look like an amount as the second word of a compound name.
const AMOUNT_UNIT_SUFFIXES = [
  "g", "kg", "ml", "l", "cc", "개", "컵", "큰술", "작은술", "스푼", "티스푼",
  "조각", "쪽", "알", "마리", "모", "봉지", "팩", "단", "줌", "꼬집", "병",
  "캔", "통", "인분",
];

// Splits a manually-typed line like "돼지고기 200g" into name + amount, so
// the name alone can still match fridge/shopping items by exact string (see
// resolveMissingIngredients) while the amount isn't lost — it's just kept
// alongside instead of baked into the name. Only the trailing whitespace-
// delimited token is treated as a candidate amount; if it doesn't look like
// one (no digit, not a known quantity word), the whole line stays the name
// unchanged — the common single-word-ingredient case is never touched.
function splitIngredientLine(raw: string): { name: string; amount: string | null } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.+?)\s+(\S+)$/);
  if (!match) return { name: trimmed, amount: null };
  const [, namePart, lastToken] = match;
  const looksLikeAmount =
    /\d/.test(lastToken) ||
    QUANTITY_ONLY_WORDS.has(lastToken) ||
    AMOUNT_UNIT_SUFFIXES.some((suffix) => lastToken.toLowerCase().endsWith(suffix));
  if (!looksLikeAmount) return { name: trimmed, amount: null };
  return { name: namePart.trim(), amount: lastToken };
}

function parseIngredients(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(splitIngredientLine)
    .filter((i) => i.name.length > 0);
}

// PhotoPicker submits an ordered token list ("existing:<url>" or "new:<i>",
// where <i> indexes into the "photos" file input in submission order) so the
// final array can interleave kept and newly-uploaded photos in any order.
async function resolvePhotoUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  formData: FormData
): Promise<{ urls: string[] } | { error: string }> {
  let order: string[] = [];
  try {
    order = JSON.parse(String(formData.get("photoOrder") ?? "[]"));
  } catch {
    order = [];
  }
  order = order.slice(0, MAX_RECIPE_PHOTOS);

  const newFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let uploadedUrls: string[] = [];
  if (newFiles.length > 0) {
    const uploaded = await uploadRecipePhotos(supabase, householdId, newFiles);
    if ("error" in uploaded) return { error: uploaded.error };
    uploadedUrls = uploaded.urls;
  }

  const urls = order
    .map((token) => {
      if (token.startsWith("new:")) return uploadedUrls[Number(token.slice(4))] ?? null;
      if (token.startsWith("existing:")) return token.slice("existing:".length);
      return null;
    })
    .filter((url): url is string => !!url);

  return { urls };
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function saveReferenceLink(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  userId: string,
  recipeId: string,
  rawUrl: string
) {
  const value = rawUrl.trim();
  if (!value) return;

  const preview = await fetchLinkPreview(value);
  if (!preview.ok) return;

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("bookmarks")
      .update({
        url: preview.url,
        title: preview.title,
        domain: preview.domain,
        thumbnail_url: preview.thumbnailUrl,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("bookmarks").insert({
      household_id: householdId,
      url: preview.url,
      title: preview.title,
      domain: preview.domain,
      thumbnail_url: preview.thumbnailUrl,
      recipe_id: recipeId,
      created_by: userId,
    });
  }
}

export async function createRecipe(_prevState: unknown, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const ingredients = parseIngredients(String(formData.get("ingredients") ?? ""));
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const referenceUrl = String(formData.get("referenceUrl") ?? "");
  const hideIngredients = formData.get("hideIngredients") === "on";

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();

  const photos = await resolvePhotoUrls(supabase, household.id, formData);
  if ("error" in photos) return { error: photos.error };

  // The list sorts by position first (nulls last), so a plain insert with
  // no position would land at the very bottom regardless of created_at.
  // Placing new recipes one below the current lowest position — instead of
  // renumbering every other row — is what puts them at the top.
  const { data: topRecipe } = await supabase
    .from("recipes")
    .select("position")
    .eq("household_id", household.id)
    .order("position", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const newPosition = (topRecipe?.position ?? 0) - 1;

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      title: title || null,
      subtitle: subtitle || null,
      cover_photo_urls: photos.urls,
      icon_emoji: iconEmoji || null,
      tags,
      notes: notes || null,
      hide_ingredients: hideIngredients,
      created_by: user.id,
      position: newPosition,
    })
    .select("id")
    .single();

  if (error || !recipe) return { error: "메뉴를 저장하지 못했어요." };

  const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(
    ingredients.map((ing, i) => ({ recipe_id: recipe.id, name: ing.name, amount: ing.amount, position: i }))
  );
  if (ingredientsError) {
    await supabase.from("recipes").delete().eq("id", recipe.id);
    return { error: "재료를 저장하지 못했어요. 다시 시도해주세요." };
  }

  await saveReferenceLink(supabase, household.id, user.id, recipe.id, referenceUrl);

  const nickname = await getNickname(supabase, user.id);
  notifyHousehold(household.id, user.id, {
    title: "새 레시피 추가",
    body: title
      ? `${nickname}님이 "${title}" 레시피를 추가했어요`
      : `${nickname}님이 링크를 저장했어요`,
    url: `/recipes/${recipe.id}`,
  }).catch(() => {});

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(_prevState: unknown, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const ingredients = parseIngredients(String(formData.get("ingredients") ?? ""));
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const referenceUrl = String(formData.get("referenceUrl") ?? "");
  const hideIngredients = formData.get("hideIngredients") === "on";

  if (!id) return { error: "메뉴를 찾을 수 없어요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();

  const photos = await resolvePhotoUrls(supabase, household.id, formData);
  if ("error" in photos) return { error: photos.error };

  const update: Record<string, unknown> = {
    title: title || null,
    subtitle: subtitle || null,
    icon_emoji: iconEmoji || null,
    tags,
    notes: notes || null,
    hide_ingredients: hideIngredients,
    cover_photo_urls: photos.urls,
  };

  const { error } = await supabase.from("recipes").update(update).eq("id", id);
  if (error) return { error: "메뉴를 수정하지 못했어요." };

  const { error: deleteError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", id);
  const { error: insertError } = deleteError
    ? { error: deleteError }
    : await supabase
        .from("recipe_ingredients")
        .insert(ingredients.map((ing, i) => ({ recipe_id: id, name: ing.name, amount: ing.amount, position: i })));
  if (deleteError || insertError) return { error: "재료를 저장하지 못했어요. 다시 시도해주세요." };

  await saveReferenceLink(supabase, household.id, user.id, id, referenceUrl);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);

  revalidatePath("/recipes");
  redirect("/recipes");
}

// Used by the recipe list's 선택삭제 mode — unlike deleteRecipe (a single
// detail-page delete that redirects away), this deletes several at once and
// the caller is already on /recipes, so no redirect.
export async function deleteRecipes(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = await createClient();
  await supabase.from("recipes").delete().in("id", ids);

  revalidatePath("/recipes");
}

export async function resolveMissingIngredients(payload: {
  recipeId: string;
  shopping: string[];
  fridge: string[];
  skip: string[];
}) {
  const { recipeId, shopping, fridge, skip } = payload;
  if (!recipeId) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();

  const unskipped = [...shopping, ...fridge];
  await Promise.all([
    unskipped.length
      ? supabase
          .from("recipe_ingredients")
          .update({ skipped: false })
          .eq("recipe_id", recipeId)
          .in("name", unskipped)
      : Promise.resolve(),
    skip.length
      ? supabase
          .from("recipe_ingredients")
          .update({ skipped: true })
          .eq("recipe_id", recipeId)
          .in("name", skip)
      : Promise.resolve(),
  ]);

  if (shopping.length) {
    const [{ data: recipe }, { data: existing }] = await Promise.all([
      supabase.from("recipes").select("title").eq("id", recipeId).single(),
      supabase
        .from("shopping_items")
        .select("id, name, source_recipe_title")
        .eq("household_id", household.id),
    ]);
    const recipeTitle = recipe?.title ?? null;
    const existingByName = new Map((existing ?? []).map((i) => [i.name, i]));

    const toInsert = shopping.filter((name) => !existingByName.has(name));
    const toUpdate = recipeTitle
      ? shopping
          .map((name) => existingByName.get(name))
          .filter((item): item is NonNullable<typeof item> => !!item)
          .map((item) => {
            const titles = (item.source_recipe_title ?? "")
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean);
            if (titles.includes(recipeTitle)) return null;
            return { id: item.id, source_recipe_title: [...titles, recipeTitle].join(", ") };
          })
          .filter((u): u is { id: string; source_recipe_title: string } => !!u)
      : [];

    if (toInsert.length) {
      await supabase.from("shopping_items").insert(
        toInsert.map((name) => ({
          household_id: household.id,
          name,
          source_recipe_id: recipeId,
          source_recipe_title: recipeTitle,
        }))
      );
    }

    if (toUpdate.length) {
      // household_id is included so the upsert's INSERT-path RLS check
      // (which requires it) is satisfied — every id here already exists, so
      // the insert branch never actually runs, only the update does.
      await supabase.from("shopping_items").upsert(
        toUpdate.map((u) => ({
          id: u.id,
          household_id: household.id,
          source_recipe_title: u.source_recipe_title,
        }))
      );
    }
  }

  if (fridge.length) {
    await supabase.from("fridge_items").upsert(
      fridge.map((name) => ({
        household_id: household.id,
        name,
        in_stock: true,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "household_id,name" }
    );
  }

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/shopping");
  revalidatePath("/fridge");
}

export async function reorderRecipes(order: string[]) {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.rpc("reorder_recipes", { recipe_ids: order });

  revalidatePath("/recipes");
}

export async function toggleFavoriteRecipe(id: string, next: boolean) {
  const supabase = await createClient();
  await supabase.from("recipes").update({ is_favorite: next }).eq("id", id);
  revalidatePath("/recipes");
}

// Renames a tag across every recipe in the household at once (see
// rename_recipe_tag, 0045) rather than editing recipes one at a time.
export async function renameHouseholdTag(oldName: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.rpc("rename_recipe_tag", {
    target_household_id: household.id,
    old_name: oldName,
    new_name: trimmed,
  });

  revalidatePath("/recipes");
  revalidatePath("/mypage/tags");
}

// "요리했어요!" log — recipe_cook_logs (0002) existed since the very first
// photo-upload migration but never had an action or UI built for it. A
// photo is optional — logging that you cooked something shouldn't require
// stopping to take a picture first.
export async function addCookLog(payload: {
  recipeId: string;
  recipeTitle: string;
  rating: number | null;
  photo: File | null;
}): Promise<{ error: string } | { success: true }> {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();
  let photoUrl: string | null = null;
  if (payload.photo) {
    const uploaded = await uploadRecipePhotos(supabase, household.id, [payload.photo]);
    if ("error" in uploaded) return { error: uploaded.error };
    photoUrl = uploaded.urls[0];
  }

  const { error } = await supabase.from("recipe_cook_logs").insert({
    household_id: household.id,
    recipe_id: payload.recipeId,
    photo_url: photoUrl,
    rating: payload.rating,
  });
  if (error) return { error: "기록을 저장하지 못했어요." };

  const nickname = await getNickname(supabase, user.id);
  notifyHousehold(household.id, user.id, {
    title: "요리했어요!",
    body: `${nickname}님이 "${payload.recipeTitle}"을(를) 요리했어요!`,
    url: `/recipes/${payload.recipeId}`,
  }).catch(() => {});

  revalidatePath(`/recipes/${payload.recipeId}`);
  return { success: true as const };
}

export async function deleteCookLog(id: string, recipeId: string) {
  const supabase = await createClient();
  await supabase.from("recipe_cook_logs").delete().eq("id", id);
  revalidatePath(`/recipes/${recipeId}`);
}

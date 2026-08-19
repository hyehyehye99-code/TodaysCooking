"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { uploadRecipePhoto } from "@/lib/actions/storage";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

function parseIngredients(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  const photo = formData.get("photo");
  const referenceUrl = String(formData.get("referenceUrl") ?? "");

  if (!title) return { error: "요리 이름을 입력해주세요." };
  if (ingredients.length === 0) return { error: "재료를 한 개 이상 입력해주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "요리책을 먼저 만들어주세요." };

  const supabase = await createClient();

  let coverPhotoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const uploaded = await uploadRecipePhoto(supabase, household.id, photo);
    if ("error" in uploaded) return { error: uploaded.error };
    coverPhotoUrl = uploaded.url;
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      title,
      subtitle: subtitle || null,
      cover_photo_url: coverPhotoUrl,
      icon_emoji: iconEmoji || null,
      tags,
      notes: notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !recipe) return { error: "레시피를 저장하지 못했어요." };

  await supabase.from("recipe_ingredients").insert(
    ingredients.map((name, i) => ({ recipe_id: recipe.id, name, position: i }))
  );

  await saveReferenceLink(supabase, household.id, user.id, recipe.id, referenceUrl);

  revalidatePath("/recipes");
  revalidatePath("/bookmarks");
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
  const photo = formData.get("photo");
  const referenceUrl = String(formData.get("referenceUrl") ?? "");

  if (!id) return { error: "레시피를 찾을 수 없어요." };
  if (!title) return { error: "요리 이름을 입력해주세요." };
  if (ingredients.length === 0) return { error: "재료를 한 개 이상 입력해주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "요리책을 먼저 만들어주세요." };

  const supabase = await createClient();

  const update: Record<string, unknown> = {
    title,
    subtitle: subtitle || null,
    icon_emoji: iconEmoji || null,
    tags,
    notes: notes || null,
  };

  if (photo instanceof File && photo.size > 0) {
    const uploaded = await uploadRecipePhoto(supabase, household.id, photo);
    if ("error" in uploaded) return { error: uploaded.error };
    update.cover_photo_url = uploaded.url;
  }

  const { error } = await supabase.from("recipes").update(update).eq("id", id);
  if (error) return { error: "레시피를 수정하지 못했어요." };

  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
  await supabase
    .from("recipe_ingredients")
    .insert(ingredients.map((name, i) => ({ recipe_id: id, name, position: i })));

  await saveReferenceLink(supabase, household.id, user.id, id, referenceUrl);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  revalidatePath("/bookmarks");
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

export async function resolveMissingIngredients(payload: {
  recipeId: string;
  shopping: string[];
  fridge: string[];
}) {
  const { recipeId, shopping, fridge } = payload;
  if (!recipeId) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();

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

    await Promise.all(
      toUpdate.map((u) =>
        supabase
          .from("shopping_items")
          .update({ source_recipe_title: u.source_recipe_title })
          .eq("id", u.id)
      )
    );
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
  await Promise.all(
    order.map((id, index) =>
      supabase.from("recipes").update({ position: index }).eq("id", id)
    )
  );

  revalidatePath("/recipes");
}

export async function toggleFavoriteRecipe(id: string, next: boolean) {
  const supabase = await createClient();
  await supabase.from("recipes").update({ is_favorite: next }).eq("id", id);
  revalidatePath("/recipes");
}

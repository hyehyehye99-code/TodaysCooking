"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

type GuestImportPayload = {
  recipes: {
    title: string;
    subtitle: string;
    cookTimeMinutes: number | null;
    ingredients: string[];
  }[];
  fridge: Record<string, boolean>;
  bookmarks: { url: string; title: string | null; domain: string | null; thumbnailUrl: string | null }[];
  shopping: { name: string; checked: boolean; sourceRecipeTitle: string | null }[];
};

export async function importGuestData(payload: GuestImportPayload) {
  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "요리책이 없어요." };

  const supabase = await createClient();

  for (const r of payload.recipes) {
    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        household_id: household.id,
        title: r.title,
        subtitle: r.subtitle || null,
        cook_time_minutes: r.cookTimeMinutes,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (!error && recipe) {
      await supabase
        .from("recipe_ingredients")
        .insert(r.ingredients.map((name, i) => ({ recipe_id: recipe.id, name, position: i })));
    }
  }

  const fridgeRows = Object.entries(payload.fridge)
    .filter(([, inStock]) => inStock)
    .map(([name]) => ({
      household_id: household.id,
      name,
      in_stock: true,
      updated_at: new Date().toISOString(),
    }));
  if (fridgeRows.length) {
    await supabase.from("fridge_items").upsert(fridgeRows, { onConflict: "household_id,name" });
  }

  if (payload.bookmarks.length) {
    await supabase.from("bookmarks").insert(
      payload.bookmarks.map((b) => ({
        household_id: household.id,
        url: b.url,
        title: b.title,
        domain: b.domain,
        thumbnail_url: b.thumbnailUrl,
        created_by: user.id,
      }))
    );
  }

  if (payload.shopping.length) {
    await supabase.from("shopping_items").insert(
      payload.shopping.map((s) => ({
        household_id: household.id,
        name: s.name,
        checked: s.checked,
        source_recipe_title: s.sourceRecipeTitle,
      }))
    );
  }

  revalidatePath("/recipes");
  revalidatePath("/fridge");
  revalidatePath("/bookmarks");
  revalidatePath("/shopping");

  return { success: true };
}

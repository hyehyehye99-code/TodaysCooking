"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredients";

export async function toggleShoppingItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nextChecked = formData.get("nextChecked") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("shopping_items").update({ checked: nextChecked }).eq("id", id);

  revalidatePath("/shopping");
}

export async function addShoppingItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("shopping_items").insert({ household_id: household.id, name });

  revalidatePath("/shopping");
}

export async function deleteShoppingItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("shopping_items").delete().eq("id", id);

  revalidatePath("/shopping");
}

export async function clearCheckedItems() {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase
    .from("shopping_items")
    .delete()
    .eq("household_id", household.id)
    .eq("checked", true);

  revalidatePath("/shopping");
}

const CATEGORY_BY_NAME = new Map(
  INGREDIENT_CATEGORIES.flatMap((cat) => cat.items.map((name) => [name, cat.name]))
);

export async function finishShoppingTrip() {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();

  const { data: checked } = await supabase
    .from("shopping_items")
    .select("id, name")
    .eq("household_id", household.id)
    .eq("checked", true);

  if (!checked || checked.length === 0) return;

  const fridgeRows = checked.map((item) => ({
    household_id: household.id,
    name: item.name,
    category: CATEGORY_BY_NAME.get(item.name) ?? "기타",
    in_stock: true,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("fridge_items").upsert(fridgeRows, { onConflict: "household_id,name" });
  await supabase
    .from("shopping_items")
    .delete()
    .in("id", checked.map((item) => item.id));

  revalidatePath("/shopping");
  revalidatePath("/fridge");
  revalidatePath("/recipes");
}

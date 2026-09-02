"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { CATEGORY_BY_INGREDIENT_NAME } from "@/lib/ingredients";
import { notifyHousehold } from "@/lib/actions/activity";

async function getNickname(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("nickname").eq("id", userId).maybeSingle();
  return data?.nickname ?? "누군가";
}

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

  const { user, household } = await getCurrentHousehold();
  if (!household || !user) return;

  const supabase = await createClient();
  await supabase.from("shopping_items").insert({ household_id: household.id, name });

  revalidatePath("/shopping");

  const nickname = await getNickname(supabase, user.id);
  notifyHousehold(household.id, user.id, {
    title: "장보기 목록 추가",
    body: `${nickname}님이 "${name}"을(를) 장보기에 추가했어요`,
    url: "/shopping",
  }).catch(() => {});
}

export async function setAllShoppingItemsChecked(formData: FormData) {
  const checked = formData.get("checked") === "true";

  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("household_id", household.id);

  revalidatePath("/shopping");
}

export async function clearAllShoppingItems() {
  const { household } = await getCurrentHousehold();
  if (!household) return;

  const supabase = await createClient();
  await supabase.from("shopping_items").delete().eq("household_id", household.id);

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

export async function finishShoppingTrip() {
  const { user, household } = await getCurrentHousehold();
  if (!household || !user) return;

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
    category: CATEGORY_BY_INGREDIENT_NAME.get(item.name) ?? "미분류",
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

  const nickname = await getNickname(supabase, user.id);
  notifyHousehold(household.id, user.id, {
    title: "장보기 완료",
    body: `${nickname}님이 장보기를 완료하고 재료 ${checked.length}개를 냉장고에 추가했어요`,
    url: "/fridge",
  }).catch(() => {});
}

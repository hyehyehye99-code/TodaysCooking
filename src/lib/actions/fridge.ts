"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export type FridgeSaveItem = { name: string; category: string; inStock: boolean };

export async function saveFridge(items: FridgeSaveItem[], toDelete: string[] = []) {
  const { household } = await getCurrentHousehold();
  if (!household) return { error: "부엌을 먼저 만들어주세요." };

  const supabase = await createClient();

  if (toDelete.length) {
    await supabase
      .from("fridge_items")
      .delete()
      .eq("household_id", household.id)
      .in("name", toDelete);
  }

  if (items.length) {
    const rows = items.map((i) => ({
      household_id: household.id,
      name: i.name,
      category: i.category,
      in_stock: i.inStock,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("fridge_items")
      .upsert(rows, { onConflict: "household_id,name" });

    if (error) return { error: "저장하지 못했어요." };
  }

  revalidatePath("/fridge");
  revalidatePath("/recipes");
  return { success: true as const };
}

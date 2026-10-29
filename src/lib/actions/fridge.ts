"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

// expiresOn: undefined leaves the stored date alone, null clears it.
export type FridgeSaveItem = { name: string; category: string; inStock: boolean; expiresOn?: string | null };

export async function saveFridge(items: FridgeSaveItem[], toDelete: string[] = []) {
  const { household } = await getCurrentHousehold();
  if (!household) return { error: "우리집을 먼저 만들어주세요." };

  const supabase = await createClient();

  if (toDelete.length) {
    await supabase
      .from("fridge_items")
      .delete()
      .eq("household_id", household.id)
      .in("name", toDelete);
  }

  // One upsert per shape: rows with and without expires_on can't share a
  // batch, since supabase-js fills a missing key with null and would wipe
  // dates that a plain stock toggle never meant to touch.
  const withExpiry = items.filter((i) => i.expiresOn !== undefined);
  const withoutExpiry = items.filter((i) => i.expiresOn === undefined);
  for (const [group, includeExpiry] of [[withoutExpiry, false], [withExpiry, true]] as const) {
    if (!group.length) continue;
    const rows = group.map((i) => ({
      household_id: household.id,
      name: i.name,
      category: i.category,
      in_stock: i.inStock,
      ...(includeExpiry ? { expires_on: i.expiresOn && /^\d{4}-\d{2}-\d{2}$/.test(i.expiresOn) ? i.expiresOn : null } : {}),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("fridge_items").upsert(rows, { onConflict: "household_id,name" });
    if (error) return { error: "저장하지 못했어요." };
  }

  revalidatePath("/mypage/fridge");
  revalidatePath("/recipes");
  return { success: true as const };
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export type SetupPayload = {
  mode: "create" | "join";
  name: string;
  code: string;
  nickname: string;
  fridge: Record<string, boolean>;
};

async function applySetup(payload: SetupPayload) {
  const supabase = await createClient();

  if (payload.nickname.trim()) {
    await supabase.rpc("upsert_my_nickname", { new_nickname: payload.nickname.trim() });
  }

  if (payload.mode === "create") {
    const { error } = await supabase.rpc("create_household", {
      household_name: payload.name,
    });
    if (error) return { error: "요리책을 만들지 못했어요. 다시 시도해주세요.", field: "name" as const };
  } else {
    const { error } = await supabase.rpc("join_household_with_code", {
      invite_code: payload.code,
    });
    if (error) return { error: "코드가 올바르지 않거나 만료되었어요.", field: "code" as const };
  }

  const { household } = await getCurrentHousehold();
  if (!household) return { error: "요리책 정보를 확인하지 못했어요." };

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

  return { success: true as const };
}

export async function completeOnboardingAuthed(payload: SetupPayload) {
  const result = await applySetup(payload);
  if ("error" in result) return result;
  redirect("/recipes");
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export type SetupPayload = {
  mode: "create" | "join";
  name: string;
  code: string;
  nickname: string;
};

async function applySetup(payload: SetupPayload) {
  const supabase = await createClient();

  if (payload.nickname.trim()) {
    await supabase.rpc("upsert_my_nickname", { new_nickname: payload.nickname.trim() });
  }

  if (payload.mode === "create") {
    // complete_onboarding_create() is atomic (a unique-constrained claim
    // row inside the same transaction as the household insert) — unlike a
    // client-side "check for a household, then create one" pattern, this
    // can't lose a race between two calls close together (a duplicate
    // native auth-callback delivery, a retried request, ...) and end up
    // creating two households. A losing call just gets back the winner's
    // household id instead of creating its own.
    const { error } = await supabase.rpc("complete_onboarding_create", {
      household_name: payload.name,
    });
    if (error) return { error: "우리집을 만들지 못했어요. 다시 시도해주세요.", field: "name" as const };
  } else {
    const { error } = await supabase.rpc("join_household_with_code", {
      p_invite_code: payload.code,
    });
    if (error) return { error: "코드가 올바르지 않아요.", field: "code" as const };
  }

  const { household } = await getCurrentHousehold();
  if (!household) return { error: "우리집 정보를 확인하지 못했어요." };

  return { success: true as const };
}

export async function completeOnboardingAuthed(payload: SetupPayload) {
  const result = await applySetup(payload);
  if ("error" in result) return result;
  redirect("/recipes");
}

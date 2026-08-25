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
  // Idempotency guard: this action is only ever meant to run once, for a
  // user with no household yet. If it somehow runs twice for the same
  // onboarding session (a fast double-tap racing past the client-side
  // guard, a retried request, etc.), the second call must not create a
  // second household — just finish nickname setup and treat it as done.
  const { household: existingHousehold } = await getCurrentHousehold();
  if (existingHousehold) {
    if (payload.nickname.trim()) {
      const supabase = await createClient();
      await supabase.rpc("upsert_my_nickname", { new_nickname: payload.nickname.trim() });
    }
    return { success: true as const };
  }

  const supabase = await createClient();

  if (payload.nickname.trim()) {
    await supabase.rpc("upsert_my_nickname", { new_nickname: payload.nickname.trim() });
  }

  if (payload.mode === "create") {
    const { error } = await supabase.rpc("create_household", {
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

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { isValidUsername, usernameToEmail } from "@/lib/username";

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
    if (error) return { error: "요리책을 만들지 못했어요. 다시 시도해주세요." };
  } else {
    const { error } = await supabase.rpc("join_household_with_code", {
      invite_code: payload.code,
    });
    if (error) return { error: "코드가 올바르지 않거나 만료되었어요." };
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

export async function completeOnboardingWithSignup(
  payload: SetupPayload & { username: string; password: string }
) {
  const username = payload.username.trim().toLowerCase();
  if (!isValidUsername(username)) {
    return { error: "아이디는 영문 소문자, 숫자, _ 로 4~20자여야 해요." };
  }
  if (payload.password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 해요." };
  }

  const supabase = await createClient();
  const { error: signUpError } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password: payload.password,
  });
  if (signUpError) {
    console.error("signUp error:", signUpError);
    if (
      signUpError.message.toLowerCase().includes("already registered") ||
      signUpError.code === "user_already_exists"
    ) {
      return { error: "이미 사용 중인 아이디예요." };
    }
    return { error: "회원가입에 실패했어요. 다시 시도해주세요." };
  }

  const result = await applySetup(payload);
  if ("error" in result) return result;
  redirect("/recipes");
}

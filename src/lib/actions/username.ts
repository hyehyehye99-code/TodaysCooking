"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidUsername } from "@/lib/username";

export async function checkUsernameAvailable(rawUsername: string) {
  const username = rawUsername.trim().toLowerCase();
  if (!isValidUsername(username)) {
    return { error: "아이디는 영문 소문자, 숫자, _ 로 4~20자여야 해요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_username_taken", {
    check_username: username,
  });

  if (error) {
    console.error("is_username_taken error:", error);
    return { error: "확인하지 못했어요. 다시 시도해주세요." };
  }

  return { available: !data };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const iconEmoji = String(formData.get("iconEmoji") ?? "").trim();
  if (!nickname) return { error: "닉네임을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_my_profile", {
    new_nickname: nickname,
    new_icon_emoji: iconEmoji,
  });
  if (error) return { error: "프로필을 저장하지 못했어요." };

  revalidatePath("/mypage");
  revalidatePath("/mypage/account");
  revalidatePath("/recipes");
  return { success: true as const };
}

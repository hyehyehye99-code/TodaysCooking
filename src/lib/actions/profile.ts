"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateNickname(_prevState: unknown, formData: FormData) {
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (!nickname) return { error: "닉네임을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_my_nickname", { new_nickname: nickname });
  if (error) return { error: "닉네임을 저장하지 못했어요." };

  revalidatePath("/mypage");
  return { success: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitInquiry(
  _prevState: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "문의 내용을 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  const { error } = await supabase.from("inquiries").insert({ user_id: user.id, message });
  if (error) return { error: "문의 접수에 실패했어요. 잠시 후 다시 시도해주세요." };

  revalidatePath("/mypage/inquiry");
  return { success: true };
}

export type MyInquiry = {
  id: string;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function getMyInquiries(): Promise<MyInquiry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("inquiries")
    .select("id, message, status, admin_note, created_at, resolved_at")
    .order("created_at", { ascending: false });
  return (data as MyInquiry[] | null) ?? [];
}

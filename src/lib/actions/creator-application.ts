"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitCreatorApplication(_prevState: unknown, formData: FormData) {
  const creatorName = String(formData.get("creatorName") ?? "").trim();
  const channelType = String(formData.get("channelType") ?? "").trim();
  const channelName = String(formData.get("channelName") ?? "").trim();
  const channelLink = String(formData.get("channelLink") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const representativeLinks = formData
    .getAll("representativeLinks")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!creatorName) return { error: "크리에이터 이름을 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  const { error } = await supabase.from("creator_applications").insert({
    applicant_user_id: user.id,
    creator_name: creatorName,
    channel_type: channelType || null,
    channel_name: channelName || null,
    channel_link: channelLink || null,
    tags,
    representative_links: representativeLinks,
  });
  if (error) return { error: "지원서를 제출하지 못했어요." };

  revalidatePath("/mypage/creator-apply");
  return { success: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

export async function addBookmark(_prevState: unknown, formData: FormData) {
  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) return { error: "링크를 입력해주세요." };

  const { user, household } = await getCurrentHousehold();
  if (!user || !household) return { error: "요리책을 먼저 만들어주세요." };

  const preview = await fetchLinkPreview(rawUrl);
  if (!preview.ok) return { error: preview.error };

  const supabase = await createClient();
  const { error } = await supabase.from("bookmarks").insert({
    household_id: household.id,
    url: preview.url,
    title: preview.title,
    domain: preview.domain,
    thumbnail_url: preview.thumbnailUrl,
    created_by: user.id,
  });

  if (error) return { error: "저장하지 못했어요." };

  revalidatePath("/bookmarks");
  return { success: true };
}

export async function deleteBookmark(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("bookmarks").delete().eq("id", id);

  revalidatePath("/bookmarks");
}

export async function updateBookmarkNote(id: string, note: string) {
  const supabase = await createClient();
  await supabase
    .from("bookmarks")
    .update({ note: note.trim() || null })
    .eq("id", id);

  revalidatePath("/bookmarks");
}

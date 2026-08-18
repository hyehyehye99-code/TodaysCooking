import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadRecipePhoto(
  supabase: SupabaseClient,
  householdId: string,
  file: File
) {
  if (!file || file.size === 0) return { error: "사진을 선택해주세요." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${householdId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("recipe-photos").upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) return { error: "사진을 업로드하지 못했어요." };

  const { data } = supabase.storage.from("recipe-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}

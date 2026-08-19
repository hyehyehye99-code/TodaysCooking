import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadRecipePhotos(
  supabase: SupabaseClient,
  householdId: string,
  files: File[]
): Promise<{ error: string } | { urls: string[] }> {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${householdId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("recipe-photos").upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (error) return null;

      const { data } = supabase.storage.from("recipe-photos").getPublicUrl(path);
      return data.publicUrl;
    })
  );

  if (uploads.some((url) => url === null)) return { error: "사진을 업로드하지 못했어요." as const };
  return { urls: uploads as string[] };
}

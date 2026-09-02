"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminExploreSearchResult = {
  source: "creator" | "personal";
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  creator_name: string;
};

export async function createCollection(
  title: string,
  emoji: string | null
): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };
  const trimmed = title.trim();
  if (!trimmed) return { error: "제목을 입력해주세요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("explore_collections").insert({ title: trimmed, emoji: emoji || null });
  if (error) return { error: "만들지 못했어요." };

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
  return { ok: true };
}

export async function updateCollection(
  id: string,
  fields: { title?: string; emoji?: string | null; active?: boolean; position?: number }
): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("explore_collections").update(fields).eq("id", id);
  if (error) return { error: "수정하지 못했어요." };

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
  return { ok: true };
}

export async function deleteCollection(id: string): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("explore_collections").delete().eq("id", id);
  if (error) return { error: "삭제하지 못했어요." };

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
  return { ok: true };
}

// Reuses the same search the public Explore search bar uses — admin just
// needs to find a recipe by title to add it to a collection, and this
// already covers both creator and personal (published) recipes.
export async function searchExploreRecipesForAdmin(query: string): Promise<AdminExploreSearchResult[]> {
  if (!(await isAdminAuthenticated())) return [];
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("search_explore_recipes", { p_query: query });
  return (data as AdminExploreSearchResult[] | null) ?? [];
}

export async function addItemToCollection(
  collectionId: string,
  sourceType: "creator" | "personal",
  sourceId: string
): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("explore_collection_items")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", collectionId);

  const { error } = await supabase.from("explore_collection_items").upsert(
    {
      collection_id: collectionId,
      source_type: sourceType,
      source_id: sourceId,
      position: count ?? 0,
    },
    { onConflict: "collection_id,source_type,source_id" }
  );
  if (error) return { error: "추가하지 못했어요." };

  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/explore");
  return { ok: true };
}

export async function removeItemFromCollection(
  collectionId: string,
  sourceType: "creator" | "personal",
  sourceId: string
) {
  if (!(await isAdminAuthenticated())) return;
  const supabase = createAdminClient();
  await supabase
    .from("explore_collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);

  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/explore");
}

export async function createBanner(
  title: string,
  emoji: string | null,
  linkUrl: string | null,
  imageUrl: string | null,
  collectionId: string | null
): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };
  const trimmed = title.trim();
  if (!trimmed) return { error: "문구를 입력해주세요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("explore_banners").insert({
    title: trimmed,
    emoji: emoji || null,
    link_url: linkUrl || null,
    image_url: imageUrl || null,
    collection_id: collectionId || null,
  });
  if (error) return { error: "만들지 못했어요." };

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
  return { ok: true };
}

export async function updateBanner(
  id: string,
  fields: {
    title?: string;
    emoji?: string | null;
    link_url?: string | null;
    image_url?: string | null;
    collection_id?: string | null;
    active?: boolean;
    position?: number;
  }
): Promise<{ error: string } | { ok: true }> {
  if (!(await isAdminAuthenticated())) return { error: "관리자 로그인이 필요해요." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("explore_banners").update(fields).eq("id", id);
  if (error) return { error: "수정하지 못했어요." };

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
  return { ok: true };
}

export async function deleteBanner(id: string) {
  if (!(await isAdminAuthenticated())) return;
  const supabase = createAdminClient();
  await supabase.from("explore_banners").delete().eq("id", id);

  revalidatePath("/admin/collections");
  revalidatePath("/explore");
}

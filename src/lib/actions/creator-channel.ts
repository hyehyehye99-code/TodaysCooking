"use server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchYoutubeChannelVideos, extractYoutubeVideoId, type ChannelVideo } from "@/lib/actions/youtube";
import { adminGenerateRecipeFromLink } from "@/lib/actions/ai-recipe";
import { createCreatorRecipe } from "@/lib/actions/admin";

export type ChannelVideoWithStatus = ChannelVideo & { alreadyAdded: boolean };

// Admin-only wrapper around fetchYoutubeChannelVideos — same gating pattern
// as adminGenerateRecipeFromLink in ai-recipe.ts, since this also spends
// YouTube API quota and must never be reachable without the admin session.
// Also flags videos that already have a recipe for this creator (matched by
// video id, not exact URL string, so youtu.be links / extra query params /
// an old import that predates source_url tracking still line up).
export async function adminFetchChannelVideos(
  creatorId: string,
  channelLink: string,
  pageToken?: string
): Promise<
  { ok: true; videos: ChannelVideoWithStatus[]; nextPageToken: string | null } | { ok: false; error: string }
> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "관리자 로그인이 필요해요." };

  const trimmed = channelLink.trim();
  if (!trimmed) return { ok: false, error: "채널 링크가 없어요." };

  const [result, existingSourceUrls] = await Promise.all([
    fetchYoutubeChannelVideos(trimmed, pageToken),
    fetchExistingSourceVideoIds(creatorId),
  ]);
  if (!result.ok) return result;

  const videos = result.videos.map((v) => ({ ...v, alreadyAdded: existingSourceUrls.has(v.videoId) }));
  return { ok: true, videos, nextPageToken: result.nextPageToken };
}

async function fetchExistingSourceVideoIds(creatorId: string): Promise<Set<string>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("creator_recipes")
    .select("source_url")
    .eq("creator_id", creatorId)
    .not("source_url", "is", null);

  const ids = new Set<string>();
  for (const row of (data as { source_url: string | null }[] | null) ?? []) {
    const videoId = row.source_url ? extractYoutubeVideoId(row.source_url) : null;
    if (videoId) ids.add(videoId);
  }
  return ids;
}

export type BulkVideoImportResult =
  | { ok: true; id: string; title: string }
  | { ok: false; error: string; skipped?: boolean };

// Runs one video through the same AI extraction + save path as the manual
// "AI 자동 작성" + "레시피 저장" flow (adminGenerateRecipeFromLink,
// createCreatorRecipe) — called once per video from a client-side loop
// rather than looping server-side, so a 50-video batch can't blow past a
// single request's execution-time limit and the admin sees live progress.
export async function adminAddRecipeFromChannelVideo(
  creatorId: string,
  video: { url: string; title: string }
): Promise<BulkVideoImportResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "관리자 로그인이 필요해요." };

  const content = await adminGenerateRecipeFromLink(video.url);
  if (!content.ok) {
    // A non-recipe video ("이 링크는 요리 레시피가 아닌 것 같아요.") is an
    // expected skip, not a failure — flagged so the client can show it
    // differently from a real error (quota, network, etc).
    const skipped = content.error.includes("레시피가 아닌");
    return { ok: false, error: content.error, skipped };
  }

  const title = content.title?.trim() || video.title.trim();
  if (!title) return { ok: false, error: "제목을 확인하지 못했어요." };

  const saved = await createCreatorRecipe({
    creatorId,
    title,
    subtitle: content.subtitle ?? "",
    iconEmoji: "",
    coverPhotoUrl: content.thumbnailUrl ?? "",
    // Tags are picked by the admin, not the AI — left empty for the same
    // reason as the manual "AI 자동 작성" flow.
    tags: [],
    notes: content.instructions,
    ingredients: content.ingredients,
    sourceUrl: video.url,
  });
  if ("error" in saved) return { ok: false, error: saved.error };

  return { ok: true, id: saved.id, title };
}

// Not "use server" — this module is only ever imported by ai-recipe.ts (a
// server action file), and one of its exports (extractYoutubeVideoId) is a
// synchronous function. Next.js requires every export in a "use server" file
// to be async (it treats each one as a directly callable Server Action), so
// marking this file that way fails the build; as a plain server-only helper
// module it doesn't need the directive at all.

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function extractYoutubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;

  const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
  if (shortsMatch) return shortsMatch[1];

  if (url.pathname === "/watch") return url.searchParams.get("v");

  return null;
}

type VideoDetails = {
  description: string | null;
  comments: { text: string; isCreator: boolean }[];
};

// The video description and comments are where a lot of creators actually
// paste the written recipe — oEmbed (used for the title/thumbnail) doesn't
// expose either, so without this the AI has nothing but a title to work
// from and ends up guessing at a recipe instead of extracting the real one.
export async function fetchYoutubeVideoDetails(videoId: string): Promise<VideoDetails | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!videoRes.ok) return null;
    const videoData = await videoRes.json();
    const snippet = videoData.items?.[0]?.snippet;
    if (!snippet) return null;

    const description: string | null =
      typeof snippet.description === "string" && snippet.description.trim()
        ? snippet.description.trim().slice(0, 2500)
        : null;
    const channelId: string | undefined = snippet.channelId;

    let comments: { text: string; isCreator: boolean }[] = [];
    try {
      const commentsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(videoId)}&order=relevance&maxResults=20&textFormat=plainText&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        comments = (commentsData.items ?? [])
          .map((item: unknown) => {
            const top = (item as { snippet?: { topLevelComment?: { snippet?: Record<string, unknown> } } })
              .snippet?.topLevelComment?.snippet;
            if (!top || typeof top.textDisplay !== "string") return null;
            const authorChannelId = top.authorChannelId as { value?: unknown } | undefined;
            return {
              text: top.textDisplay.trim().slice(0, 1500),
              isCreator: !!channelId && authorChannelId?.value === channelId,
            };
          })
          .filter((c: { text: string; isCreator: boolean } | null): c is { text: string; isCreator: boolean } =>
            !!c && c.text.length > 0
          );
      }
    } catch {
      // comments are a bonus, not required — fall through with just the description
    }

    // Creator's own comment first (that's where the recipe usually lives),
    // then a handful of other top comments as backup context.
    comments.sort((a, b) => Number(b.isCreator) - Number(a.isCreator));

    return { description, comments: comments.slice(0, 8) };
  } catch {
    return null;
  }
}

export type ChannelVideo = {
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
};

type ChannelVideosResult =
  | { ok: true; videos: ChannelVideo[]; nextPageToken: string | null }
  | { ok: false; error: string };

async function fetchUploadsPlaylistId(query: string, apiKey: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&${query}&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

// Legacy custom URLs (youtube.com/c/name) and bare vanity paths aren't
// resolvable to a channel via the channels.list lookups below — search.list
// is the only way to turn that kind of name into a channel id.
async function searchUploadsPlaylistId(term: string, apiKey: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(term)}&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const channelId = data.items?.[0]?.snippet?.channelId;
  if (typeof channelId !== "string" || !channelId) return null;
  return fetchUploadsPlaylistId(`id=${encodeURIComponent(channelId)}`, apiKey);
}

// A creator's channel_link can be any of YouTube's URL shapes —
// /channel/UCxxx, /@handle, /c/customName, /user/username, or a bare
// vanity path like /somename — so each is tried in turn rather than
// assuming one format.
async function resolveUploadsPlaylistId(channelLink: string, apiKey: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(channelLink.startsWith("http") ? channelLink : `https://${channelLink}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (!first) return null;

  if (first === "channel" && second) {
    return fetchUploadsPlaylistId(`id=${encodeURIComponent(second)}`, apiKey);
  }
  if (first === "user" && second) {
    return (
      (await fetchUploadsPlaylistId(`forUsername=${encodeURIComponent(second)}`, apiKey)) ??
      searchUploadsPlaylistId(second, apiKey)
    );
  }
  if (first === "c" && second) {
    return searchUploadsPlaylistId(second, apiKey);
  }
  const handle = first.startsWith("@") ? first : `@${first}`;
  return (
    (await fetchUploadsPlaylistId(`forHandle=${encodeURIComponent(handle)}`, apiKey)) ??
    searchUploadsPlaylistId(first.replace(/^@/, ""), apiKey)
  );
}

// Fetches one page (up to 50) of a channel's uploaded videos, newest first,
// for the admin's "채널에서 영상 가져오기" picker — resolves channelLink to its
// uploads playlist once, then pages that playlist via pageToken.
export async function fetchYoutubeChannelVideos(
  channelLink: string,
  pageToken?: string
): Promise<ChannelVideosResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { ok: false, error: "YouTube API가 아직 설정되지 않았어요." };

  try {
    const uploadsPlaylistId = await resolveUploadsPlaylistId(channelLink, apiKey);
    if (!uploadsPlaylistId) return { ok: false, error: "채널을 찾지 못했어요. 채널 링크를 확인해주세요." };

    const params = new URLSearchParams({
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: "영상 목록을 가져오지 못했어요." };
    const data = await res.json();

    const videos: ChannelVideo[] = ((data.items ?? []) as unknown[])
      .map((item) => {
        const snippet = (item as { snippet?: Record<string, unknown> }).snippet;
        const resourceId = snippet?.resourceId as { videoId?: unknown } | undefined;
        const videoId = resourceId?.videoId;
        if (typeof videoId !== "string" || !videoId) return null;
        const thumbnails = snippet?.thumbnails as Record<string, { url?: string } | undefined> | undefined;
        const thumbnailUrl = thumbnails?.medium?.url ?? thumbnails?.default?.url ?? null;
        return {
          videoId,
          title: typeof snippet?.title === "string" ? snippet.title : "(제목 없음)",
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnailUrl,
          publishedAt: typeof snippet?.publishedAt === "string" ? snippet.publishedAt : null,
        };
      })
      // The uploads playlist keeps a placeholder entry for videos that were
      // deleted or made private — those have no real content to scrape.
      .filter((v): v is ChannelVideo => v !== null && v.title !== "Private video" && v.title !== "Deleted video");

    return { ok: true, videos, nextPageToken: data.nextPageToken ?? null };
  } catch {
    return { ok: false, error: "영상 목록을 가져오는 중 오류가 발생했어요." };
  }
}

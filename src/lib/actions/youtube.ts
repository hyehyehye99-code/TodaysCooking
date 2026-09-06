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

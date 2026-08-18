"use server";

function normalizeUrl(rawUrl: string) {
  const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("invalid protocol");
  return url;
}

export async function fetchLinkPreview(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) return { ok: false as const, error: "링크를 입력해주세요." };

  let url: URL;
  try {
    url = normalizeUrl(value);
  } catch {
    return { ok: false as const, error: "올바른 링크가 아니에요." };
  }

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DulUiBueokBot/1.0)" },
    });
    const html = await res.text();

    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const imageMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );

    return {
      ok: true as const,
      url: url.toString(),
      domain: url.hostname.replace(/^www\./, ""),
      title: titleMatch?.[1]?.trim() ?? null,
      thumbnailUrl: imageMatch?.[1]?.trim() ?? null,
    };
  } catch {
    return {
      ok: true as const,
      url: url.toString(),
      domain: url.hostname.replace(/^www\./, ""),
      title: null,
      thumbnailUrl: null,
    };
  }
}

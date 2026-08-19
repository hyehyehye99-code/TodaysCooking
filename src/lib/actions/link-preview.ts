"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function normalizeUrl(rawUrl: string) {
  const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("invalid protocol");
  return url;
}

// blocks SSRF: refuse to fetch a user-supplied URL that resolves to a
// loopback/private/link-local address (e.g. cloud metadata endpoints).
function isDisallowedAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 127 ||
      a === 10 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const lower = address.toLowerCase();
  return lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd");
}

async function assertPublicHost(hostname: string) {
  if (hostname === "localhost") throw new Error("blocked host");
  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isDisallowedAddress(a.address))) {
    throw new Error("blocked host");
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeHtmlEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === "#") {
      const codePoint =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function extractTitle(html: string) {
  // some sites (Instagram reels included) stuff a multi-paragraph SEO blob
  // into og:title — skip any candidate containing a raw newline, since a
  // real single-line title never does, and fall through to the next tag.
  const candidates = [
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1],
  ];
  const raw = candidates.find((c) => c && !/[\r\n]/.test(c));
  if (!raw) return null;
  const decoded = decodeHtmlEntities(raw).trim().replace(/\s+/g, " ");
  return decoded.length > 200 ? decoded.slice(0, 200).trim() + "…" : decoded;
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

// YouTube's watch-page HTML is scraped by the generic path below, but that
// page is frequently rate-limited or swapped for a cookie-consent wall when
// requested from a datacenter/serverless IP (e.g. Vercel), which silently
// yields no og:title/og:image. oEmbed is the officially supported,
// lightweight alternative for exactly this and isn't subject to that wall.
async function fetchYoutubeOEmbed(url: URL) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.toString())}&format=json`;
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = await res.json();
  const title = typeof data.title === "string" ? data.title : null;
  const thumbnailUrl = typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  if (!title && !thumbnailUrl) return null;
  return { title, thumbnailUrl };
}

export async function fetchLinkPreview(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) return { ok: false as const, error: "링크를 입력해주세요." };

  let url: URL;
  try {
    url = normalizeUrl(value);
    await assertPublicHost(url.hostname);
  } catch {
    return { ok: false as const, error: "올바른 링크가 아니에요." };
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    try {
      const oembed = await fetchYoutubeOEmbed(url);
      if (oembed) {
        return {
          ok: true as const,
          url: url.toString(),
          domain: url.hostname.replace(/^www\./, ""),
          title: oembed.title,
          thumbnailUrl: oembed.thumbnailUrl,
        };
      }
    } catch {
      // fall through to the generic scraper below
    }
  }

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DulUiBueokBot/1.0)" },
    });
    const html = await res.text();

    const imageMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );

    return {
      ok: true as const,
      url: url.toString(),
      domain: url.hostname.replace(/^www\./, ""),
      title: extractTitle(html),
      thumbnailUrl: imageMatch?.[1] ? decodeHtmlEntities(imageMatch[1]).trim() : null,
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

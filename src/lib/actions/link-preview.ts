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

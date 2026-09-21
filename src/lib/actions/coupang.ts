"use server";

import { createCoupangDeeplink } from "@/lib/coupang-partners";

// Used when the Partners API keys aren't set or the API call fails, so a
// "구매하기" tap never dead-ends — it just lands on the generic link instead
// of the ingredient's own search page.
const FALLBACK_AFFILIATE_LINK = "https://link.coupang.com/a/g9lXsbZXnE";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 500;
// Same ingredient gets bought again and again (양파, 계란, ...) — remembering
// the link per warm server instance saves API quota and makes repeat taps
// instant. Failures aren't cached, so a blip doesn't stick for hours.
const linkCache = new Map<string, { url: string; expires: number }>();

export async function getCoupangSearchLink(name?: string): Promise<{ url: string }> {
  const keyword = (name ?? "").trim().slice(0, 60);
  if (!keyword) return { url: FALLBACK_AFFILIATE_LINK };

  const cacheKey = keyword.toLowerCase();
  const hit = linkCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return { url: hit.url };

  const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
  const url = await createCoupangDeeplink(searchUrl, "recipeing");
  if (!url) return { url: FALLBACK_AFFILIATE_LINK };

  if (linkCache.size >= CACHE_MAX) linkCache.delete(linkCache.keys().next().value!);
  linkCache.set(cacheKey, { url, expires: Date.now() + CACHE_TTL_MS });
  return { url };
}

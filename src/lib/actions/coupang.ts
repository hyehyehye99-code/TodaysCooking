"use server";

// Coupang Partners' Open API isn't wired up yet, so every "구매하기" tap goes
// to this one affiliate link for now instead of a per-ingredient deeplink.
const AFFILIATE_LINK = "https://link.coupang.com/a/g9lXsbZXnE";

export async function getCoupangSearchLink(): Promise<{ url: string }> {
  return { url: AFFILIATE_LINK };
}

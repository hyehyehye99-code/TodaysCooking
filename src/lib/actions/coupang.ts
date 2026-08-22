"use server";

import crypto from "crypto";

const DOMAIN = "https://api-gateway.coupang.com";
const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

// Coupang Partners Open API's custom signature scheme: HMAC-SHA256 over
// "{signedDate}{method}{path}{query}" using the secret key, with a signed
// date in "yyMMdd'T'HHmmss'Z'" (UTC, 2-digit year) — not a standard format,
// so it can't be produced with a library date formatter.
function signedDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${yy}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildAuthHeader(method: string, path: string, query: string) {
  const accessKey = process.env.COUPANG_ACCESS_KEY!;
  const secretKey = process.env.COUPANG_SECRET_KEY!;
  const datetime = signedDate();
  const message = `${datetime}${method}${path}${query}`;
  const signature = crypto.createHmac("sha256", secretKey).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

// Turns a shopping-list ingredient name into a link that opens Coupang search
// results for it. Once COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY are set, the
// plain search URL is converted into a tracked link.coupang.com short link via
// the Open API so clicks count toward the household's Partners channel; until
// then it just falls back to the untracked search URL so the feature already
// works before the keys exist.
export async function getCoupangSearchLink(name: string): Promise<{ url: string }> {
  const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(name)}`;

  if (!process.env.COUPANG_ACCESS_KEY || !process.env.COUPANG_SECRET_KEY) {
    return { url: searchUrl };
  }

  try {
    const authorization = buildAuthHeader("POST", DEEPLINK_PATH, "");
    const res = await fetch(`${DOMAIN}${DEEPLINK_PATH}`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ coupangUrls: [searchUrl] }),
    });
    if (!res.ok) return { url: searchUrl };

    const data = await res.json();
    const shortenUrl = data?.data?.[0]?.shortenUrl;
    return { url: typeof shortenUrl === "string" && shortenUrl ? shortenUrl : searchUrl };
  } catch {
    return { url: searchUrl };
  }
}

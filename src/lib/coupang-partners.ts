// Not "use server" — plain server-only helper, imported by actions/coupang.ts.
// Talks to Coupang Partners' Open API (HMAC-signed) to turn a Coupang search
// URL into a tracked affiliate link.

import { createHmac } from "node:crypto";

const HOST = "https://api-gateway.coupang.com";
const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

// Coupang wants "yyMMdd'T'HHmmss'Z'" in GMT, e.g. 240315T123456Z.
function signedDate(now = new Date()) {
  const iso = now.toISOString();
  return `${iso.slice(2, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
}

function authorization(method: string, path: string, query: string, accessKey: string, secretKey: string) {
  const datetime = signedDate();
  const signature = createHmac("sha256", secretKey)
    .update(datetime + method + path + query)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export function isCoupangConfigured() {
  return !!(process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY);
}

// Converts any coupang.com URL into an affiliate short link (link.coupang.com/...)
// credited to the partner account that owns the API keys. Returns null on any
// failure (missing keys, network, non-"0" rCode) so callers can fall back.
export async function createCoupangDeeplink(coupangUrl: string, subId?: string): Promise<string | null> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  try {
    const res = await fetch(HOST + DEEPLINK_PATH, {
      method: "POST",
      headers: {
        Authorization: authorization("POST", DEEPLINK_PATH, "", accessKey, secretKey),
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ coupangUrls: [coupangUrl], ...(subId ? { subId } : {}) }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[coupang] deeplink HTTP", res.status);
      return null;
    }
    const json = (await res.json()) as {
      rCode?: string;
      rMessage?: string;
      data?: { shortenUrl?: string; landingUrl?: string }[];
    };
    if (json.rCode !== "0") {
      console.error("[coupang] deeplink rCode", json.rCode, json.rMessage);
      return null;
    }
    const link = json.data?.[0]?.shortenUrl || json.data?.[0]?.landingUrl;
    return link || null;
  } catch (err) {
    console.error("[coupang] deeplink failed", err);
    return null;
  }
}

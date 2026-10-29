import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkPreview } from "@/lib/actions/link-preview";

// Weekly (see vercel.json). Instagram's og:image URLs are signed CDN links
// that die after a while, so saved links slowly lose their thumbnail. This
// re-scrapes the ones that are expired or about to expire.
export const maxDuration = 300;

const EXPIRY_MARGIN_MS = 10 * 24 * 60 * 60 * 1000; // refresh anything dying before the next run
const BATCH = 5;

// Instagram CDN URLs carry the expiry as a hex unix timestamp in `oe=`.
function expiresSoon(url: string | null) {
  if (!url) return true;
  const oe = new URL(url, "https://x.invalid").searchParams.get("oe");
  if (!oe) return false;
  const expiresAt = parseInt(oe, 16) * 1000;
  return Number.isFinite(expiresAt) && expiresAt - Date.now() < EXPIRY_MARGIN_MS;
}

export async function GET(request: NextRequest) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET`. Fails closed when unset.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, url, thumbnail_url")
    .ilike("domain", "%instagram.com");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const due = (bookmarks ?? []).filter((b) => expiresSoon(b.thumbnail_url));
  let refreshed = 0;
  let failed = 0;

  for (let i = 0; i < due.length; i += BATCH) {
    await Promise.all(
      due.slice(i, i + BATCH).map(async (b) => {
        const preview = await fetchLinkPreview(b.url);
        // Keep the old value on a failed scrape (login wall, rate limit) —
        // it may still work, and the next run tries again.
        if (!preview.ok || !preview.thumbnailUrl || preview.thumbnailUrl === b.thumbnail_url) {
          failed++;
          return;
        }
        const { error: updateError } = await supabase
          .from("bookmarks")
          .update({ thumbnail_url: preview.thumbnailUrl })
          .eq("id", b.id);
        if (updateError) failed++;
        else refreshed++;
      })
    );
  }

  return Response.json({ checked: bookmarks?.length ?? 0, due: due.length, refreshed, failed });
}

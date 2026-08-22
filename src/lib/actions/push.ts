"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:hyehyehye1919@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();
  if (!user || !household) return { ok: false as const };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      household_id: household.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

// Fire-and-forget from callers — never let a push failure affect their own
// response. Cleans up subscriptions the push service reports as gone
// (404/410 — the browser unsubscribed, or the endpoint expired) as it goes.
export async function sendPushToHousehold(
  householdId: string,
  excludeUserId: string,
  notification: { title: string; body: string; url?: string }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const supabase = await createClient();
  const { data: subs } = await supabase.rpc("get_household_push_subscriptions", {
    p_household_id: householdId,
    p_exclude_user_id: excludeUserId,
  });
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify(notification);

  await Promise.allSettled(
    (subs as { endpoint: string; p256dh: string; auth: string }[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );
}

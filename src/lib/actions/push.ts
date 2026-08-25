"use server";

import webpush from "web-push";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:hyehyehye1919@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// The native app (Capacitor/WKWebView) can't use Web Push at all — no
// PushManager — so it registers an FCM token instead, sent through Firebase
// Admin. Both delivery paths run independently; a household with a mix of
// web and native members gets notified on both.
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// A malformed credential must never throw at module load: this file is
// imported from server pages, and an uncaught throw here fails the whole
// production build, not just push notifications.
let firebaseConfigured = false;
if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
    }
    firebaseConfigured = true;
  } catch (err) {
    console.error("Firebase Admin init failed — FCM push disabled:", err);
  }
}

export async function saveFcmToken(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();
  if (!user || !household) return { ok: false as const };

  const { error } = await supabase
    .from("fcm_tokens")
    .upsert({ user_id: user.id, household_id: household.id, token }, { onConflict: "token" });

  return { ok: !error };
}

export async function removeFcmToken(token: string) {
  const supabase = await createClient();
  await supabase.from("fcm_tokens").delete().eq("token", token);
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
  const supabase = await createClient();

  const webPushDone = (async () => {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

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
  })();

  const fcmDone = (async () => {
    if (!firebaseConfigured) return;

    const { data: tokens } = await supabase.rpc("get_household_fcm_tokens", {
      p_household_id: householdId,
      p_exclude_user_id: excludeUserId,
    });
    if (!tokens || tokens.length === 0) return;

    const messaging = getMessaging();
    await Promise.allSettled(
      (tokens as { token: string }[]).map(async ({ token }) => {
        try {
          await messaging.send({
            token,
            notification: { title: notification.title, body: notification.body },
            data: notification.url ? { url: notification.url } : undefined,
          });
        } catch (err) {
          // Same idea as the 404/410 cleanup above: a token FCM reports as
          // unregistered is gone for good (app uninstalled, token rotated).
          const code = (err as { errorInfo?: { code?: string } }).errorInfo?.code;
          if (code === "messaging/registration-token-not-registered") {
            await supabase.from("fcm_tokens").delete().eq("token", token);
          }
        }
      })
    );
  })();

  await Promise.allSettled([webPushDone, fcmDone]);
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import {
  savePushSubscription,
  removePushSubscription,
  saveFcmToken,
  removeFcmToken,
} from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function subscribeNever() {
  return () => {};
}

// Both checks need the same false-during-SSR/true-after-hydration dance:
// Capacitor.isNativePlatform() reads `window.Capacitor`, which doesn't
// exist during server rendering (that always runs in plain Node, even for
// requests the native app itself makes) — evaluating it directly in render
// would mismatch against the real client value once hydrated.
function getIsNativeSnapshot() {
  return Capacitor.isNativePlatform();
}
function getIsNativeServerSnapshot() {
  return false;
}

// PushManager isn't available during SSR, and on iOS Safari it's only
// present at all once the page has been added to the home screen.
function getWebSupportedSnapshot() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}
function getWebSupportedServerSnapshot() {
  return false;
}

type Status = "checking" | "off" | "denied" | "on" | "working";

export function PushNotificationToggle() {
  const isNative = useSyncExternalStore(subscribeNever, getIsNativeSnapshot, getIsNativeServerSnapshot);
  const webSupported = useSyncExternalStore(
    subscribeNever,
    getWebSupportedSnapshot,
    getWebSupportedServerSnapshot
  );
  const [status, setStatus] = useState<Status>("checking");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (isNative) {
      (async () => {
        try {
          const { receive } = await FirebaseMessaging.checkPermissions();
          if (receive === "denied") {
            setStatus("denied");
            return;
          }
          if (receive === "granted") {
            const { token } = await FirebaseMessaging.getToken();
            setFcmToken(token);
            setStatus("on");
          } else {
            setStatus("off");
          }
        } catch {
          // The native Firebase Messaging plugin isn't in the installed
          // build yet (e.g. right after adding it, before the next
          // TestFlight archive) — fail open to "off" instead of getting
          // stuck on "checking" forever, which renders nothing.
          setStatus("off");
        }
      })();
      return;
    }

    if (!webSupported) return;
    (async () => {
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setStatus(subscription ? "on" : "off");
    })();
  }, [isNative, webSupported]);

  async function enable() {
    setStatus("working");
    try {
      if (isNative) {
        const { receive } = await FirebaseMessaging.requestPermissions();
        if (receive !== "granted") {
          setStatus(receive === "denied" ? "denied" : "off");
          return;
        }
        const { token } = await FirebaseMessaging.getToken();
        setFcmToken(token);
        await saveFcmToken(token);
        setStatus("on");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setStatus("off");
        return;
      }
      await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("on");
    } catch {
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("working");
    try {
      if (isNative) {
        if (fcmToken) await removeFcmToken(fcmToken);
        await FirebaseMessaging.deleteToken();
        setFcmToken(null);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await removePushSubscription(subscription.endpoint);
      }
    } finally {
      setStatus("off");
    }
  }

  const supported = isNative || webSupported;
  if (!supported || status === "checking") return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">알림</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          {status === "denied"
            ? "설정에서 알림 권한을 허용해주세요."
            : "다른 가족이 장보기에 항목을 추가하면 알려드려요."}
        </p>
      </div>
      {status !== "denied" && (
        <button
          type="button"
          onClick={status === "on" ? disable : enable}
          disabled={status === "working"}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60 ${
            status === "on" ? "bg-surface text-ink-soft" : "bg-accent text-white"
          }`}
        >
          {status === "working" ? "처리 중..." : status === "on" ? "알림 끄기" : "알림 받기"}
        </button>
      )}
    </div>
  );
}

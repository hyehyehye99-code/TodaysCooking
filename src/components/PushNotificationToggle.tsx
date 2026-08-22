"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui";
import { savePushSubscription, removePushSubscription } from "@/lib/actions/push";

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

// PushManager isn't available during SSR, and on iOS Safari it's only
// present at all once the page has been added to the home screen — so this
// has to be checked client-side only, with a false server snapshot.
function getSupportedSnapshot() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

function getSupportedServerSnapshot() {
  return false;
}

type Status = "checking" | "off" | "denied" | "on" | "working";

export function PushNotificationToggle() {
  const supported = useSyncExternalStore(subscribeNever, getSupportedSnapshot, getSupportedServerSnapshot);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (!supported) return;
    (async () => {
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      setStatus(subscription ? "on" : "off");
    })();
  }, [supported]);

  async function enable() {
    setStatus("working");
    try {
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

  if (!supported || status === "checking") return null;

  return (
    <GlassCard className="bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold">알림</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {status === "denied"
              ? "브라우저 설정에서 알림 권한을 허용해주세요."
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
    </GlassCard>
  );
}

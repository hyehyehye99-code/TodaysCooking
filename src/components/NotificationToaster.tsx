"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ToastNotification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
};

const AUTO_DISMISS_MS = 5000;

export function NotificationToaster({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as ToastNotification;
          setToasts((prev) => [...prev, row]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== row.id));
          }, AUTO_DISMISS_MS);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleClick(toast: ToastNotification) {
    dismiss(toast.id);
    if (toast.url) router.push(toast.url);
  }

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ top: "max(env(safe-area-inset-top), 16px)" }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className="animate-fade-in-up pointer-events-auto w-full max-w-[420px] cursor-pointer rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{toast.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{toast.body}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              aria-label="닫기"
              className="flex h-5 w-5 shrink-0 items-center justify-center text-ink-faint"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

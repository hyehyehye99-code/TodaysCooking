"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  deleteNotification,
  deleteAllNotifications,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";

type Notification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  created_at: string;
};

// Safe to compute plainly at render time: this list is only ever rendered
// client-side after the initial server render already resolved, no SSR/
// client mismatch risk (same reasoning as share-menu-button.tsx's copy).
function relativeTimeFrom(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / (60 * 24))}일 전`;
}

function NotificationRow({ notification }: { notification: Notification }) {
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    setHidden(true);
    startTransition(async () => {
      await deleteNotification(notification.id);
      router.refresh();
    });
  }

  if (hidden) return null;

  const body = (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{notification.title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{notification.body}</p>
        <p className="mt-1 text-[11px] text-ink-faint">{relativeTimeFrom(notification.created_at)}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDelete();
        }}
        aria-label="알림 삭제"
        className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-faint"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  if (notification.url) {
    return (
      <Link href={notification.url} className="block">
        {body}
      </Link>
    );
  }

  return body;
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // revalidatePath (inside markAllNotificationsRead) is only valid from a
  // real Server Action invocation, not while a page is rendering — so this
  // has to be triggered from here (a client component, after mount) rather
  // than awaited directly in the server page component.
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  function doClearAll() {
    startTransition(async () => {
      await deleteAllNotifications();
      setConfirmingClear(false);
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <p className="mt-10 text-center text-sm text-ink-soft">아직 알림이 없어요.</p>;
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmingClear(true)}
          className="px-3 py-1.5 text-xs font-bold text-ink-soft"
        >
          전체 삭제
        </button>
      </div>

      <GlassCard className="bg-white">
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      </GlassCard>

      <ConfirmModal
        open={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        title="알림을 전체 삭제할까요?"
        description="되돌릴 수 없어요."
        confirmSlot={
          <button
            type="button"
            onClick={doClearAll}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제 중..." : "전체 삭제"}
          </button>
        }
      />
    </>
  );
}

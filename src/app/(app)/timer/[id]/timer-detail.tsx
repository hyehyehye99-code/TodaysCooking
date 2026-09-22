"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { setTimerRunning, resetTimer } from "@/lib/actions/timers";
import {
  scheduleTimerAlarm,
  cancelTimerAlarm,
  scheduleTimerAlerts,
  cancelTimerAlerts,
} from "@/lib/timerNotifications";
import { startTimerActivity, endTimerActivity } from "@/lib/timerActivity";
import { DefaultMascot } from "@/components/Mascot";
import { useDict } from "@/lib/i18n/client";
import type { Timer } from "@/lib/types";
import { formatTime, liveRemaining, playBeep } from "../timer-utils";

export type TimerDetailData = Timer & {
  recipes: {
    title: string | null;
    cover_photo_urls: string[];
    icon_emoji: string | null;
    bookmarks?: { thumbnail_url: string | null }[] | null;
  } | null;
  timer_alerts: { id: string; remaining_seconds: number; message: string }[];
};

export function TimerDetail({ timer }: { timer: TimerDetailData }) {
  const dict = useDict();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [firedNowId, setFiredNowId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const completedRef = useRef(false);
  const firedAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const live = liveRemaining(timer, now);
  const completed = !timer.is_running && live <= 0;

  useEffect(() => {
    if (!timer.is_running) {
      completedRef.current = false;
      return;
    }
    if (live > 0 || completedRef.current) return;
    completedRef.current = true;

    playBeep();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(timer.name, { body: dict.timer.completedBadge });
      }
    } catch {
      // Notification API not available in this context — beep already fired.
    }
    startTransition(async () => {
      await Promise.all([setTimerRunning(timer.id, false), endTimerActivity(timer.id)]);
      router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, timer.is_running]);

  useEffect(() => {
    if (!timer.is_running) return;
    for (const alert of timer.timer_alerts) {
      if (live > alert.remaining_seconds) {
        firedAlertsRef.current.delete(alert.id);
        continue;
      }
      if (firedAlertsRef.current.has(alert.id)) continue;
      firedAlertsRef.current.add(alert.id);

      playBeep();
      setFiredNowId(alert.id);
      setTimeout(() => setFiredNowId((cur) => (cur === alert.id ? null : cur)), 5000);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(timer.name, { body: alert.message });
        }
      } catch {
        // Notification API not available in this context — beep already fired.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, timer.is_running]);

  function toggleRunning() {
    const next = !timer.is_running;
    const startFrom = live <= 0 ? timer.duration_seconds : live;
    startTransition(async () => {
      await setTimerRunning(timer.id, next);
      if (next) {
        const endEpochMs = Date.now() + startFrom * 1000;
        await Promise.all([
          scheduleTimerAlarm(timer.id, timer.name, new Date(endEpochMs)),
          scheduleTimerAlerts(timer.name, startFrom, timer.timer_alerts),
          startTimerActivity({ id: timer.id, name: timer.name, iconEmoji: timer.icon_emoji, endEpochMs }),
        ]);
      } else {
        await Promise.all([
          cancelTimerAlarm(timer.id),
          cancelTimerAlerts(timer.timer_alerts.map((a) => a.id)),
          endTimerActivity(timer.id),
        ]);
      }
      router.refresh();
    });
  }

  function handleReset() {
    startTransition(async () => {
      await Promise.all([
        resetTimer(timer.id),
        cancelTimerAlarm(timer.id),
        cancelTimerAlerts(timer.timer_alerts.map((a) => a.id)),
        endTimerActivity(timer.id),
      ]);
      router.refresh();
    });
  }

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-2xl">
            {timer.icon_emoji || <DefaultMascot pool="timer" seed={timer.id} box={48} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[18px] font-bold">{timer.name}</h1>
              {completed && (
                <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {dict.timer.completedBadge}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/timer"
          aria-label={dict.common.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-1 py-8">
        <p className="text-[56px] font-bold leading-none tabular-nums text-ink">{formatTime(live)}</p>
        <p className="text-sm tabular-nums text-ink-faint">{formatTime(timer.duration_seconds)}</p>
      </div>

      {timer.recipes && (
        <Link
          href={`/recipes/${timer.recipe_id}?from=${encodeURIComponent(`/timer/${timer.id}`)}`}
          className="mb-6 block"
        >
          <GlassCard className="flex items-center gap-3 bg-white p-3">
            <RecipeThumb
              seed={timer.recipes.title ?? "recipe"}
              coverPhotoUrl={timer.recipes.cover_photo_urls[0]}
              iconEmoji={timer.recipes.icon_emoji}
              linkThumbnailUrl={timer.recipes.bookmarks?.[0]?.thumbnail_url}
              size={48}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{timer.recipes.title}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </GlassCard>
        </Link>
      )}

      <div className="mb-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={handleReset}
          aria-label={dict.timer.resetAria}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-soft"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 1 3 6.7" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleRunning}
          aria-label={timer.is_running ? dict.timer.pauseAria : dict.timer.resumeAria}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-accent"
        >
          {timer.is_running ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          )}
        </button>
        <div className="h-11 w-11" />
      </div>

      {timer.timer_alerts.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold text-ink-soft">{dict.timer.midAlertsLabel}</p>
          <GlassCard className="divide-y divide-border bg-white">
            {timer.timer_alerts
              .slice()
              .sort((a, b) => b.remaining_seconds - a.remaining_seconds)
              .map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-2 px-3.5 py-2.5 ${
                    firedNowId === a.id ? "bg-accent/8" : ""
                  }`}
                >
                  <span className="shrink-0 text-xs font-bold tabular-nums text-accent-ink">
                    {formatTime(a.remaining_seconds)} {dict.timer.midAlertRemainingSuffix}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{a.message}</span>
                  {firedNowId === a.id && (
                    <span className="shrink-0 animate-pulse rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {dict.timer.midAlertNowBadge}
                    </span>
                  )}
                </div>
              ))}
          </GlassCard>
        </div>
      )}

      <Link
        href={`/timer/${timer.id}/edit`}
        className="block w-full rounded-xl bg-surface py-3 text-center text-sm font-bold text-ink-soft"
      >
        {dict.recipes.editButton}
      </Link>
    </div>
  );
}

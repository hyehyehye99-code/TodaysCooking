"use client";

import { IconGlyph } from "@/components/IconGlyph";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import { DefaultMascot } from "@/components/Mascot";
import { createClient } from "@/lib/supabase/client";
import { setTimerRunning, resetTimer, deleteTimers, reorderTimers } from "@/lib/actions/timers";
import {
  scheduleTimerAlarm,
  cancelTimerAlarm,
  scheduleTimerAlerts,
  cancelTimerAlerts,
} from "@/lib/timerNotifications";
import { startTimerActivity, endTimerActivity } from "@/lib/timerActivity";
import { useDragReorder } from "@/lib/useDragReorder";
import { useDict } from "@/lib/i18n/client";
import type { TimerWithRecipe } from "@/lib/types";
import { formatElapsedLabel, formatTime, liveRemaining, playBeep } from "./timer-utils";

export function TimerList({
  householdId,
  timers,
}: {
  householdId: string;
  timers: TimerWithRecipe[];
}) {
  const dict = useDict();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [, startActionTransition] = useTransition();
  const [reorderPending, startReorderTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const completedRef = useRef<Set<string>>(new Set());
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const [firedNowKey, setFiredNowKey] = useState<string | null>(null);
  // Play/pause/reset used to wait on the DB write plus the native alarm and
  // Live Activity calls before the icon or countdown changed at all — every
  // tap felt like it hadn't registered. This flips the visible state the
  // instant a button is pressed; once `timers` catches up with what we
  // guessed (or the action throws), the override is dropped.
  const [overrides, setOverrides] = useState<
    Record<string, { is_running: boolean; started_at: string | null; remaining_seconds: number }>
  >({});
  // Tracks which `timers` array reference the overrides above were last
  // pruned against, so the reconciliation below (React's "adjust state
  // during render" pattern — see https://react.dev/learn/you-might-not-need-an-effect)
  // runs at most once per new server payload instead of on every render.
  const [prunedFor, setPrunedFor] = useState(timers);
  if (prunedFor !== timers) {
    setPrunedFor(timers);
    if (Object.keys(overrides).length > 0) {
      let changed = false;
      const next = { ...overrides };
      for (const t of timers) {
        const o = next[t.id];
        // Both fields, not just is_running — a reset fired from an
        // already-paused timer never flips is_running, only remaining_seconds.
        if (o && o.is_running === t.is_running && o.remaining_seconds === t.remaining_seconds) {
          delete next[t.id];
          changed = true;
        }
      }
      if (changed) setOverrides(next);
    }
  }

  function clearOverride(id: string) {
    setOverrides((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  const {
    order,
    setOrder,
    dragId,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragTransform,
  } = useDragReorder<TimerWithRecipe>(timers);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Lets a timer someone else in the household starts, pauses, or deletes
  // show up here without needing to reopen the tab — same pattern as
  // ActivityToaster's household-scoped subscription.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`timers:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timers", filter: `household_id=eq.${householdId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  useEffect(() => {
    for (const t of timers) {
      const live = liveRemaining(t, now);
      if (!t.is_running) continue;
      if (live > 0) {
        completedRef.current.delete(t.id);
        continue;
      }
      if (completedRef.current.has(t.id)) continue;
      completedRef.current.add(t.id);

      playBeep();
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(t.name, { body: dict.timer.completedBadge });
        }
      } catch {
        // Notification API not available in this context — beep already fired.
      }
      startActionTransition(async () => {
        await Promise.all([setTimerRunning(t.id, false), endTimerActivity(t.id)]);
        router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, timers]);

  // In-app companion to the native mid-timer notifications scheduled in
  // timer-form.tsx — covers the case where the app is open in the
  // foreground (where a scheduled local notification may not visibly pop).
  useEffect(() => {
    for (const t of timers) {
      const live = liveRemaining(t, now);
      for (const alert of t.timer_alerts) {
        const key = `${t.id}:${alert.id}`;
        if (!t.is_running || live > alert.remaining_seconds) {
          firedAlertsRef.current.delete(key);
          continue;
        }
        if (firedAlertsRef.current.has(key)) continue;
        firedAlertsRef.current.add(key);

        playBeep();
        setFiredNowKey(key);
        setTimeout(() => setFiredNowKey((cur) => (cur === key ? null : cur)), 5000);
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(t.name, { body: alert.message });
          }
        } catch {
          // Notification API not available in this context — beep already fired.
        }
      }
    }
  }, [now, timers]);

  const filtered = filter === "active" ? timers.filter((t) => t.is_running) : timers;

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEditing() {
    setOrder(timers);
    setSelectedIds(new Set());
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSelectedIds(new Set());
  }

  function saveOrder() {
    startReorderTransition(async () => {
      await reorderTimers(order.map((t) => t.id));
      setEditing(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      const selected = timers.filter((t) => selectedIds.has(t.id));
      await Promise.all([
        deleteTimers([...selectedIds]),
        ...selected.map((t) => cancelTimerAlarm(t.id)),
        ...selected.map((t) => cancelTimerAlerts(t.timer_alerts.map((a) => a.id))),
        ...selected.map((t) => endTimerActivity(t.id)),
      ]);
      setConfirmingDelete(false);
      setEditing(false);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {editing ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-bold text-ink-soft">
            {selectedIds.size > 0
              ? dict.timer.selectedCountTemplate.replace("{count}", String(selectedIds.size))
              : dict.timer.selectHint}
          </span>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={cancelEditing}
              disabled={reorderPending || deletePending}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
            >
              {dict.common.cancel}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={reorderPending || deletePending}
                className="rounded-lg bg-warn px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {dict.timer.deleteSelected}
              </button>
            )}
            <button
              onClick={saveOrder}
              disabled={reorderPending || deletePending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {dict.timer.done}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-full bg-surface p-1">
            <button
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className={`min-h-11 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filter === "all" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              {dict.timer.allFilter}
            </button>
            <button
              onClick={() => setFilter("active")}
              aria-pressed={filter === "active"}
              className={`min-h-11 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filter === "active" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              {dict.timer.activeFilter}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {timers.length > 0 && (
              <button
                onClick={startEditing}
                aria-label={dict.timer.editMenu}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-ink-soft transition-transform active:scale-90"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M6 12h12" />
                  <path d="M10 18h4" />
                </svg>
              </button>
            )}
            <Link
              href="/timer/new"
              aria-label={dict.timer.addAria}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {!editing && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-surface px-5 pb-8">
          <EmptyState mascot="cooking">{dict.timer.emptyState}</EmptyState>
          <div className="mt-6 flex justify-center">
            {filter === "active" && timers.length > 0 ? (
              <button type="button" onClick={() => setFilter("all")} className="min-h-11 rounded-2xl bg-white px-5 text-sm font-bold text-accent-ink">{dict.timer.allFilter}</button>
            ) : (
              <Link href="/timer/new" className="flex min-h-12 items-center rounded-2xl bg-accent px-5 text-sm font-bold text-white">+ {dict.timer.newTimerHeading}</Link>
            )}
          </div>
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          {order.map((timer, index) => {
            const dragging = dragId === timer.id;
            const checked = selectedIds.has(timer.id);
            return (
              <div key={timer.id} ref={registerRow(timer.id)} style={dragTransform(timer.id)}>
                <GlassCard
                  className={`flex items-center gap-2 p-3.5 ${dragging ? "shadow-lg" : ""} ${
                    checked ? "bg-accent/8 ring-2 ring-accent" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelected(timer.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-base">
                      {timer.icon_emoji ? <IconGlyph value={timer.icon_emoji} box={36} /> : <DefaultMascot pool="timer" seed={timer.id} box={36} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{timer.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                      {formatTime(liveRemaining(timer, now))}
                    </span>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        checked ? "border-accent bg-accent" : "border-border bg-white"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 7.5l3 3 6-7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, timer.id, index);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    aria-label={dict.recipes.dragReorder}
                    className="flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-full bg-surface text-ink-soft"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <circle cx="9" cy="6" r="1.4" />
                      <circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="12" r="1.4" />
                      <circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" />
                      <circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </button>
                </GlassCard>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((baseTimer) => {
            const override = overrides[baseTimer.id];
            const timer = override ? { ...baseTimer, ...override } : baseTimer;
            const live = liveRemaining(timer, now);
            const completed = !timer.is_running && live <= 0;
            const recipeTitle = timer.recipes?.title ?? null;

            return (
              <div
                key={timer.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/timer/${timer.id}`)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/timer/${timer.id}`);
                  }
                }}
                className="cursor-pointer"
              >
                <GlassCard className={`flex flex-wrap items-center gap-3 p-4 ${timer.is_running ? "border-accent/30 bg-accent/5" : "bg-white"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg">
                    {timer.icon_emoji ? <IconGlyph value={timer.icon_emoji} box={40} /> : <DefaultMascot pool="timer" seed={timer.id} box={40} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-ink-soft">{timer.name}</p>
                      {completed && (
                        <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[12px] font-bold text-white">
                          {dict.timer.completedBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[30px] font-bold leading-none tracking-tight tabular-nums text-ink">
                      {formatTime(live)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-faint">
                      <span className="tabular-nums">{formatTime(timer.duration_seconds)}</span>
                      {recipeTitle && (
                        <>
                          <span>·</span>
                          <Link
                            href={`/recipes/${timer.recipe_id}?from=${encodeURIComponent("/timer")}`}
                            className="truncate text-accent-ink"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🍳 {recipeTitle}
                          </Link>
                        </>
                      )}
                    </div>
                    {timer.timer_alerts.length > 0 && (
                      <div className="mt-1.5 flex flex-col gap-1">
                        {timer.timer_alerts
                          .slice()
                          .sort((a, b) => b.remaining_seconds - a.remaining_seconds)
                          .map((a) => {
                            const isNow = firedNowKey === `${timer.id}:${a.id}`;
                            return (
                              <div
                                key={a.id}
                                className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] ${
                                  isNow ? "bg-accent/8" : ""
                                }`}
                              >
                                <span className="shrink-0 font-bold tabular-nums text-accent-ink">
                                  {formatElapsedLabel(timer.duration_seconds - a.remaining_seconds, dict)}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-ink-faint">{a.message}</span>
                                {isNow && (
                                  <span className="shrink-0 animate-pulse rounded-full bg-accent px-1 py-0.5 text-[13px] font-bold text-white">
                                    {dict.timer.midAlertNowBadge}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = !timer.is_running;
                      const startFrom = live <= 0 ? timer.duration_seconds : live;
                      setOverrides((prev) => ({
                        ...prev,
                        [timer.id]: next
                          ? { is_running: true, started_at: new Date().toISOString(), remaining_seconds: startFrom }
                          : { is_running: false, started_at: null, remaining_seconds: startFrom },
                      }));
                      startActionTransition(async () => {
                        try {
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
                        } catch {
                          clearOverride(timer.id);
                        }
                      });
                    }}
                    aria-label={timer.is_running ? dict.timer.pauseAria : dict.timer.resumeAria}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent text-accent transition-transform active:scale-90"
                  >
                    {timer.is_running ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M7 4.5v15l13-7.5z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverrides((prev) => ({
                        ...prev,
                        [timer.id]: { is_running: false, started_at: null, remaining_seconds: timer.duration_seconds },
                      }));
                      startActionTransition(async () => {
                        try {
                          await Promise.all([
                            resetTimer(timer.id),
                            cancelTimerAlarm(timer.id),
                            cancelTimerAlerts(timer.timer_alerts.map((a) => a.id)),
                            endTimerActivity(timer.id),
                          ]);
                          router.refresh();
                        } catch {
                          clearOverride(timer.id);
                        }
                      });
                    }}
                    aria-label={dict.timer.resetAria}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft transition-transform active:scale-90"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 1 3 6.7" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </button>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={dict.timer.deleteConfirmTitle}
        description={dict.timer.deleteConfirmDesc}
        confirmSlot={
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deletePending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {dict.common.delete}
          </button>
        }
      />
    </div>
  );
}

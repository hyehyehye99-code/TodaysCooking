"use client";

import { Mascot } from "@/components/Mascot";
import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { StickyFormBar } from "@/components/StickyFormBar";
import { RecipeThumb } from "@/components/RecipeThumb";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ConfirmModal } from "@/components/ConfirmModal";
import { createTimer, updateTimer, deleteTimers, type AlertInput } from "@/lib/actions/timers";
import {
  scheduleTimerAlarm,
  cancelTimerAlarm,
  scheduleTimerAlerts,
  cancelTimerAlerts,
} from "@/lib/timerNotifications";
import { startTimerActivity, endTimerActivity } from "@/lib/timerActivity";
import { useDict } from "@/lib/i18n/client";
import { formatElapsedLabel, secondsToHms } from "./timer-utils";

const DURATION_PRESETS_MINUTES = [1, 3, 5, 10, 15, 20, 30, 60];

export type RecipeOption = {
  id: string;
  title: string;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  is_cooking: boolean;
  bookmarks?: { thumbnail_url: string | null }[] | null;
};

export type EditableTimer = {
  id: string;
  name: string;
  icon_emoji: string | null;
  duration_seconds: number;
  recipe_id: string | null;
  is_running: boolean;
  timer_alerts: { id: string; remaining_seconds: number; message: string }[];
};

// hours/minutes/seconds here are elapsed time SINCE THE TIMER STARTED — the
// way a recipe actually describes it ("10분 지나면 뒤집어주세요"), not time
// remaining until the end. Storage/scheduling still runs on remaining_seconds
// (that's what a live countdown compares against), so the two conversions —
// elapsed → remaining when saving, remaining → elapsed when loading an
// existing timer — both happen right at this component's edges; nothing
// downstream needs to know elapsed time exists.
type DraftAlert = { key: string; hours: number; minutes: number; seconds: number; message: string };

function NumberField({
  value,
  onChange,
  max,
  unit,
  small = false,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  unit: string;
  small?: boolean;
}) {
  return (
    <div className="flex-1">
      <input
        type="number"
        aria-label={unit}
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Math.max(0, Math.min(max, Number(e.target.value) || 0));
          onChange(n);
        }}
        className={
          small
            ? "w-full rounded-lg bg-white px-2 py-1.5 text-center text-sm font-semibold text-ink-soft outline-none focus:ring-2 focus:ring-accent"
            : "w-full rounded-xl bg-surface px-3 py-2.5 text-center text-lg font-bold text-ink outline-none focus:ring-2 focus:ring-accent"
        }
      />
      <p className="mt-1 text-center text-[11px] text-ink-faint">{unit}</p>
    </div>
  );
}

export function TimerForm({ recipes, timer }: { recipes: RecipeOption[]; timer?: EditableTimer }) {
  const dict = useDict();
  const router = useRouter();
  const [name, setName] = useState(timer?.name ?? "");
  const [iconEmoji, setIconEmoji] = useState(timer?.icon_emoji ?? "");
  const [hours, setHours] = useState(timer ? Math.floor(timer.duration_seconds / 3600) : 0);
  const [minutes, setMinutes] = useState(timer ? Math.floor((timer.duration_seconds % 3600) / 60) : 0);
  const [seconds, setSeconds] = useState(timer ? timer.duration_seconds % 60 : 0);
  const [recipeId, setRecipeId] = useState(timer?.recipe_id ?? "");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [recipeListOpen, setRecipeListOpen] = useState(false);
  const [alerts, setAlerts] = useState<DraftAlert[]>(() =>
    (timer?.timer_alerts ?? []).map((a) => ({
      key: a.id,
      // DB stores remaining-at-fire; convert to elapsed-since-start for display/editing here.
      ...secondsToHms(timer!.duration_seconds - a.remaining_seconds),
      message: a.message,
    }))
  );
  const [draftHours, setDraftHours] = useState(0);
  const [draftMinutes, setDraftMinutes] = useState(0);
  const [draftSeconds, setDraftSeconds] = useState(0);
  const [draftMessage, setDraftMessage] = useState("");
  const [alertError, setAlertError] = useState("");
  const alertKeyRef = useRef(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const selectedRecipe = recipes.find((r) => r.id === recipeId) ?? null;
  const filteredRecipes = recipeQuery.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(recipeQuery.trim().toLowerCase()))
    : recipes;

  function addAlert() {
    const message = draftMessage.trim();
    const draftTotalSeconds = draftHours * 3600 + draftMinutes * 60 + draftSeconds;
    const totalDuration = hours * 3600 + minutes * 60 + seconds;
    // Elapsed time only means something relative to a total — without one
    // there's nothing to check draftTotalSeconds against below, and no
    // remaining_seconds to convert it to when this actually gets saved.
    if (totalDuration <= 0) {
      setAlertError(dict.timer.midAlertNeedDurationFirst);
      return;
    }
    if (draftTotalSeconds <= 0) {
      setAlertError(dict.timer.midAlertMissingTime);
      return;
    }
    if (!message) {
      setAlertError(dict.timer.midAlertMissingMessage);
      return;
    }
    if (draftTotalSeconds >= totalDuration) {
      setAlertError(dict.timer.midAlertTooLate);
      return;
    }
    setAlertError("");
    alertKeyRef.current += 1;
    setAlerts((prev) => [
      ...prev,
      { key: `${alertKeyRef.current}`, hours: draftHours, minutes: draftMinutes, seconds: draftSeconds, message },
    ]);
    setDraftHours(0);
    setDraftMinutes(0);
    setDraftSeconds(0);
    setDraftMessage("");
  }

  function removeAlert(key: string) {
    setAlerts((prev) => prev.filter((a) => a.key !== key));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const durationSeconds = hours * 3600 + minutes * 60 + seconds;
    const finalName = name.trim() || selectedRecipe?.title || "";

    // An alert saved earlier can outlive a later edit to the total duration
    // above it — if the timer got shorter, that alert's elapsed time might
    // no longer fit inside it. Catch that here rather than silently saving
    // a negative/nonsensical remaining_seconds.
    if (alerts.some((a) => a.hours * 3600 + a.minutes * 60 + a.seconds >= durationSeconds)) {
      setError(dict.timer.midAlertTooLate);
      return;
    }

    const alertInputs: AlertInput[] = alerts.map((a) => ({
      // Convert elapsed-since-start (what the form collects) to remaining-
      // at-fire (what the countdown/notification scheduling compares against).
      remainingSeconds: durationSeconds - (a.hours * 3600 + a.minutes * 60 + a.seconds),
      message: a.message,
    }));

    startTransition(async () => {
      if (timer) {
        const result = await updateTimer(timer.id, {
          name: finalName,
          iconEmoji: iconEmoji || null,
          durationSeconds,
          recipeId: recipeId || null,
          alerts: alertInputs,
        });
        if (!("success" in result)) {
          setError(result.error);
          return;
        }
        await Promise.all([
          cancelTimerAlarm(timer.id),
          cancelTimerAlerts(timer.timer_alerts.map((a) => a.id)),
          endTimerActivity(timer.id),
        ]);
        if (timer.is_running) {
          const endEpochMs = Date.now() + durationSeconds * 1000;
          await Promise.all([
            scheduleTimerAlarm(timer.id, finalName, new Date(endEpochMs)),
            scheduleTimerAlerts(finalName, durationSeconds, result.alerts),
            startTimerActivity({ id: timer.id, name: finalName, iconEmoji, endEpochMs }),
          ]);
        }
        router.push("/timer");
        return;
      }

      const result = await createTimer({
        name: finalName,
        color: "accent",
        iconEmoji: iconEmoji || null,
        durationSeconds,
        recipeId: recipeId || null,
        alerts: alertInputs,
      });
      if (!("success" in result)) {
        setError(result.error);
        return;
      }
      // Created paused — no alarm to schedule yet. Pressing play (in the
      // list or the detail page) is what actually starts the countdown and
      // schedules the native alarm/alerts.
      router.push("/timer");
    });
  }

  function handleDelete() {
    if (!timer) return;
    startDeleteTransition(async () => {
      await Promise.all([
        deleteTimers([timer.id]),
        cancelTimerAlarm(timer.id),
        cancelTimerAlerts(timer.timer_alerts.map((a) => a.id)),
        endTimerActivity(timer.id),
      ]);
      router.push("/timer");
    });
  }

  return (
    <>
    <form id="timer-form" onSubmit={handleSubmit} className="app-form pb-24">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">
          {timer ? dict.timer.editTimerHeading : dict.timer.newTimerHeading}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          {timer && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={dict.common.delete}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-warn-ink"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
              </svg>
            </button>
          )}
          <Link
            href="/timer"
            aria-label={dict.common.close}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-bold text-ink-soft">{dict.timer.nameLabel}</p>
          <input
            value={name}
            aria-label={dict.timer.nameLabel}
            onChange={(e) => setName(e.target.value)}
            placeholder={selectedRecipe?.title || dict.timer.namePlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-ink-soft">{dict.timer.durationLabel}</p>
          <div className="flex items-center gap-2">
            <NumberField value={hours} onChange={setHours} max={23} unit={dict.timer.hoursUnit} />
            <NumberField value={minutes} onChange={setMinutes} max={59} unit={dict.timer.minutesUnit} />
            <NumberField value={seconds} onChange={setSeconds} max={59} unit={dict.timer.secondsUnit} />
          </div>

          {/* One tap sets the whole duration instead of typing into three
              separate number boxes — those stay for fine-tuning afterward
              (e.g. "10분" then nudge seconds), not as the only way in. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATION_PRESETS_MINUTES.map((m) => {
              const active = hours === 0 && minutes === m && seconds === 0;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setHours(0);
                    setMinutes(m);
                    setSeconds(0);
                  }}
                  aria-pressed={active}
                  className={`min-h-11 rounded-full px-3 py-1.5 text-xs font-bold transition-transform active:scale-90 ${
                    active ? "bg-accent text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  {m}
                  {dict.timer.minutesUnit}
                </button>
              );
            })}
          </div>

          {/* Nested inside the duration section (smaller type, inset white-on-surface
              fields) so it reads as "a sub-setting of the time above", not a second,
              equally-weighted time picker next to it. */}
          <div className="mt-3 rounded-xl bg-surface p-3">
            <p className="mb-2 text-[11px] font-semibold text-ink-faint">{dict.timer.midAlertsLabel}</p>

            {alerts.length > 0 && (
              <div className="mb-2.5 flex flex-col gap-1.5">
                {alerts.map((a) => (
                  <div key={a.key} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2">
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-accent-ink">
                      {formatElapsedLabel(a.hours * 3600 + a.minutes * 60 + a.seconds, dict)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">{a.message}</span>
                    <button
                      type="button"
                      onClick={() => removeAlert(a.key)}
                      aria-label={dict.common.delete}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-faint"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mb-1.5 text-[11px] text-ink-faint">
              {hours * 3600 + minutes * 60 + seconds <= 0
                ? dict.timer.midAlertNeedDurationFirst
                : dict.timer.midAlertHint}
            </p>
            <div className="flex items-center gap-1.5">
              <NumberField value={draftHours} onChange={setDraftHours} max={23} unit={dict.timer.hoursUnit} small />
              <NumberField value={draftMinutes} onChange={setDraftMinutes} max={59} unit={dict.timer.minutesUnit} small />
              <NumberField value={draftSeconds} onChange={setDraftSeconds} max={59} unit={dict.timer.secondsUnit} small />
            </div>
            <input
              value={draftMessage}
              aria-label={dict.timer.midAlertMessagePlaceholder}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder={dict.timer.midAlertMessagePlaceholder}
              className="mt-2 w-full rounded-lg border border-transparent bg-white px-3 py-2 text-xs outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addAlert}
              className="mt-2 w-full rounded-lg border border-dashed border-accent/60 py-2 text-[11px] font-bold text-accent-ink transition-transform active:scale-[0.98]"
            >
              + {dict.timer.midAlertAddButton}
            </button>
            {alertError && <p className="mt-1.5 text-[11px] font-semibold text-warn-ink">{alertError}</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-ink-soft">{dict.timer.iconLabel}</p>
          <EmojiPicker name="iconEmoji" defaultValue={iconEmoji} onChange={setIconEmoji} />
        </div>

        {recipes.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-ink-soft">{dict.timer.recipeLabel}</p>
              {recipeId && (
                <button
                  type="button"
                  onClick={() => {
                    if (name.trim() === selectedRecipe?.title) setName("");
                    setRecipeId("");
                  }}
                  className="text-xs font-semibold text-accent-ink"
                >
                  {dict.timer.recipeNoneOption}
                </button>
              )}
            </div>

            {selectedRecipe ? (
              timer ? (
                // In edit mode the linked recipe already exists and is safe
                // to jump to — unlike the create form, there's no in-progress
                // unsaved timer here to lose by navigating away.
                <Link
                  href={`/recipes/${selectedRecipe.id}?from=${encodeURIComponent(`/timer/${timer.id}/edit`)}`}
                >
                  <GlassCard className="flex items-center gap-3 bg-accent/8 px-3 py-2.5">
                    <RecipeThumb
                      seed={selectedRecipe.id}
                      coverPhotoUrl={selectedRecipe.cover_photo_urls[0]}
                      iconEmoji={selectedRecipe.icon_emoji}
                      linkThumbnailUrl={selectedRecipe.bookmarks?.[0]?.thumbnail_url}
                      size={40}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-accent-ink">
                      {selectedRecipe.title}
                    </span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </GlassCard>
                </Link>
              ) : (
                <GlassCard className="flex items-center gap-3 bg-accent/8 px-3 py-2.5">
                  <RecipeThumb
                    seed={selectedRecipe.id}
                    coverPhotoUrl={selectedRecipe.cover_photo_urls[0]}
                    iconEmoji={selectedRecipe.icon_emoji}
                    linkThumbnailUrl={selectedRecipe.bookmarks?.[0]?.thumbnail_url}
                    size={40}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-accent-ink">
                    {selectedRecipe.title}
                  </span>
                </GlassCard>
              )
            ) : (
              <div
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setRecipeListOpen(false);
                }}
              >
                <ClearableInput
                  value={recipeQuery}
                  onChange={(e) => setRecipeQuery(e.target.value)}
                  onFocus={() => setRecipeListOpen(true)}
                  onKeyDown={(e) => {
                    // This box only filters the list below — Enter here
                    // (e.g. a mobile keyboard's "search"/"go" key) would
                    // otherwise submit the whole timer form early, before a
                    // recipe is even picked.
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder={dict.recipes.searchPlaceholder}
                  className="mb-2 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
                {recipeListOpen && (
                  <div className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
                    {filteredRecipes.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-ink-faint">{dict.recipes.emptySearch}</p>
                    ) : (
                      filteredRecipes.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setRecipeId(r.id);
                            setRecipeListOpen(false);
                            if (!name.trim()) setName(r.title);
                          }}
                          className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2 text-left"
                        >
                          <RecipeThumb
                            seed={r.id}
                            coverPhotoUrl={r.cover_photo_urls[0]}
                            iconEmoji={r.icon_emoji}
                            linkThumbnailUrl={r.bookmarks?.[0]?.thumbnail_url}
                            size={40}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{r.title}</span>
                          {r.is_cooking && <Mascot name="cooking" size={22} className="shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs font-semibold text-warn-ink">{error}</p>}
      </div>

      <StickyFormBar
        formId="timer-form"
        pending={pending}
        label={timer ? dict.common.save : dict.timer.startButton}
        pendingLabel={dict.recipes.saving}
      />
    </form>

    {timer && (
      <ConfirmModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={dict.timer.deleteConfirmTitle}
        description={dict.timer.deleteConfirmDesc}
        confirmSlot={
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {dict.common.delete}
          </button>
        }
      />
    )}
    </>
  );
}

import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

export function secondsToHms(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return { hours: Math.floor(s / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// "1시간 10분" / "5분" / "30초" style — skips zero-valued units instead of
// always spelling out h/m/s, and uses this dictionary's own unit words so it
// reads naturally per locale (see timer.hoursUnit/minutesUnit/secondsUnit).
export function formatDurationParts(
  hours: number,
  minutes: number,
  seconds: number,
  units: { hoursUnit: string; minutesUnit: string; secondsUnit: string }
) {
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}${units.hoursUnit}`);
  if (minutes > 0) parts.push(`${minutes}${units.minutesUnit}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}${units.secondsUnit}`);
  return parts.join(" ");
}

// A mid-timer alert's full label — "10분 후" / "in 10 min" / "10分後" — from
// how long after the timer starts it fires. Used everywhere a mid-alert is
// shown (the edit form's added-alerts list, the running timer's detail and
// list views) so the three stay in sync.
export function formatElapsedLabel(elapsedSeconds: number, dict: Dictionary) {
  const { hours, minutes, seconds } = secondsToHms(elapsedSeconds);
  return dict.timer.midAlertElapsedTemplate.replace(
    "{time}",
    formatDurationParts(hours, minutes, seconds, dict.timer)
  );
}

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

type TimerLike = { is_running: boolean; started_at: string | null; remaining_seconds: number };

export function liveRemaining(timer: TimerLike, now: number) {
  if (!timer.is_running || !timer.started_at) return timer.remaining_seconds;
  const elapsed = (now - new Date(timer.started_at).getTime()) / 1000;
  return Math.max(0, timer.remaining_seconds - elapsed);
}

export function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Best-effort — autoplay policies or an unsupported browser just mean
    // silence, not a broken timer.
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export type AlertInput = { remainingSeconds: number; message: string };

// Alerts past the full duration, or with no message, can't fire meaningfully
// — dropped here rather than rejecting the whole save over one bad row.
function sanitizeAlerts(alerts: AlertInput[], durationSeconds: number) {
  return alerts
    .map((a) => ({ remainingSeconds: a.remainingSeconds, message: a.message.trim() }))
    .filter((a) => a.message && a.remainingSeconds > 0 && a.remainingSeconds < durationSeconds);
}

export async function createTimer(input: {
  name: string;
  color: string;
  iconEmoji: string | null;
  durationSeconds: number;
  recipeId: string | null;
  alerts: AlertInput[];
}): Promise<
  | { error: string }
  | { success: true; id: string; alerts: { id: string; remaining_seconds: number; message: string }[] }
> {
  const { household, user } = await getCurrentHousehold();
  if (!household || !user) return { error: "우리집을 먼저 만들어주세요." };
  const name = input.name.trim();
  if (!name) return { error: "이름을 입력해주세요." };
  if (input.durationSeconds <= 0) return { error: "시간을 설정해주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timers")
    .insert({
      household_id: household.id,
      recipe_id: input.recipeId,
      name,
      color: input.color,
      icon_emoji: input.iconEmoji,
      duration_seconds: input.durationSeconds,
      remaining_seconds: input.durationSeconds,
      is_running: false,
      started_at: null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: "타이머를 만들지 못했어요." };

  const alerts = sanitizeAlerts(input.alerts, input.durationSeconds);
  let insertedAlerts: { id: string; remaining_seconds: number; message: string }[] = [];
  if (alerts.length > 0) {
    const { data: alertRows } = await supabase
      .from("timer_alerts")
      .insert(alerts.map((a) => ({ timer_id: data.id, remaining_seconds: a.remainingSeconds, message: a.message })))
      .select("id, remaining_seconds, message");
    insertedAlerts = alertRows ?? [];
  }

  revalidatePath("/timer");
  return { success: true as const, id: data.id as string, alerts: insertedAlerts };
}

// Pause/resume both just rewrite started_at + remaining_seconds so the live
// remaining time (computed client-side from those two fields) stays correct
// with no server-side ticking — pausing freezes the live value into
// remaining_seconds, resuming restarts the clock from wherever it was left.
export async function setTimerRunning(id: string, next: boolean) {
  const supabase = await createClient();
  const { data: timer } = await supabase
    .from("timers")
    .select("remaining_seconds, started_at, is_running, duration_seconds")
    .eq("id", id)
    .maybeSingle();
  if (!timer) return;

  if (next) {
    // Pressing "start" on a timer that already ran out (remaining_seconds
    // at 0 from completing) restarts it fresh instead of "resuming" at 0,
    // which would just complete again instantly.
    const restarting = timer.remaining_seconds <= 0;
    await supabase
      .from("timers")
      .update({
        is_running: true,
        started_at: new Date().toISOString(),
        ...(restarting ? { remaining_seconds: timer.duration_seconds } : {}),
      })
      .eq("id", id);
  } else {
    const elapsed = timer.is_running && timer.started_at ? (Date.now() - new Date(timer.started_at).getTime()) / 1000 : 0;
    const remaining = Math.max(0, Math.round(timer.remaining_seconds - elapsed));
    await supabase
      .from("timers")
      .update({ is_running: false, started_at: null, remaining_seconds: remaining })
      .eq("id", id);
  }

  revalidatePath("/timer");
}

// Puts the timer back at its full duration_seconds and stops it — the same
// "start over" a physical kitchen timer's reset does, not a resume point.
export async function resetTimer(id: string) {
  const supabase = await createClient();
  const { data: timer } = await supabase.from("timers").select("duration_seconds").eq("id", id).maybeSingle();
  if (!timer) return;

  await supabase
    .from("timers")
    .update({ is_running: false, started_at: null, remaining_seconds: timer.duration_seconds })
    .eq("id", id);

  revalidatePath("/timer");
}

export async function deleteTimers(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("timers").delete().in("id", ids);
  revalidatePath("/timer");
}

export async function reorderTimers(order: string[]) {
  const supabase = await createClient();
  await supabase.rpc("reorder_timers", { timer_ids: order });
  revalidatePath("/timer");
}

// Editing always redefines the countdown to the (possibly new) duration
// rather than trying to preserve partial progress against a changed length
// — is_running itself is left alone, so a paused timer stays paused (just
// at the new full duration) and a running one keeps running from now.
export async function updateTimer(
  id: string,
  input: {
    name: string;
    iconEmoji: string | null;
    durationSeconds: number;
    recipeId: string | null;
    alerts: AlertInput[];
  }
): Promise<
  | { error: string }
  | { success: true; alerts: { id: string; remaining_seconds: number; message: string }[] }
> {
  const name = input.name.trim();
  if (!name) return { error: "이름을 입력해주세요." };
  if (input.durationSeconds <= 0) return { error: "시간을 설정해주세요." };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("timers").select("is_running").eq("id", id).maybeSingle();
  if (!existing) return { error: "타이머를 찾을 수 없어요." };

  const { error } = await supabase
    .from("timers")
    .update({
      name,
      icon_emoji: input.iconEmoji,
      recipe_id: input.recipeId,
      duration_seconds: input.durationSeconds,
      remaining_seconds: input.durationSeconds,
      started_at: existing.is_running ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: "타이머를 수정하지 못했어요." };

  // Same replace-all-child-rows approach as recipe ingredients on save —
  // simpler than diffing which alerts changed, and there's never many.
  await supabase.from("timer_alerts").delete().eq("timer_id", id);
  const alerts = sanitizeAlerts(input.alerts, input.durationSeconds);
  let insertedAlerts: { id: string; remaining_seconds: number; message: string }[] = [];
  if (alerts.length > 0) {
    const { data: alertRows } = await supabase
      .from("timer_alerts")
      .insert(alerts.map((a) => ({ timer_id: id, remaining_seconds: a.remainingSeconds, message: a.message })))
      .select("id, remaining_seconds, message");
    insertedAlerts = alertRows ?? [];
  }

  revalidatePath("/timer");
  revalidatePath(`/timer/${id}/edit`);
  return { success: true as const, alerts: insertedAlerts };
}

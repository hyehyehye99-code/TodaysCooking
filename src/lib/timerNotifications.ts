import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// LocalNotifications on iOS keeps firing on the OS's own schedule even after
// the app is killed — unlike the in-app beep/Notification path in
// timer-list.tsx, which only works while that tab/webview is alive. This is
// the only piece that makes a cooking timer useful with the app closed.
//
// The plugin needs a 32-bit int id, but timers are addressed by uuid
// everywhere else in the app — this derives a stable one from the uuid
// instead of threading a second id scheme through the DB and every action.
function numericId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

async function ensurePermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === "granted") return true;
  if (display === "denied") return false;
  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

// `at` is an absolute Date — scheduling off a fixed point in time (rather
// than "N seconds from now" inside the plugin) is what keeps this correct
// across a pause/resume that changes how much is actually left.
export async function scheduleTimerAlarm(id: string, title: string, at: Date) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!(await ensurePermission())) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: numericId(id),
          title,
          body: "타이머가 끝났어요",
          schedule: { at, allowWhileIdle: true },
        },
      ],
    });
  } catch {
    // No native LocalNotifications plugin in this build yet, or the OS
    // refused — the in-app beep/Notification path still covers foreground use.
  }
}

export async function cancelTimerAlarm(id: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: numericId(id) }] });
  } catch {
    // Nothing to cancel, or the plugin isn't available — either way, fine.
  }
}

type TimerAlertLike = { id: string; remaining_seconds: number; message: string };

// Schedules each alert whose checkpoint hasn't already passed relative to
// liveRemainingSeconds (the remaining time *right now*, at either a fresh
// start or a resume) — one further out than the countdown currently is gets
// silently skipped rather than firing immediately.
export async function scheduleTimerAlerts(
  timerName: string,
  liveRemainingSeconds: number,
  alerts: TimerAlertLike[]
) {
  if (!Capacitor.isNativePlatform()) return;
  const upcoming = alerts.filter((a) => a.remaining_seconds < liveRemainingSeconds);
  if (upcoming.length === 0) return;
  try {
    if (!(await ensurePermission())) return;
    await LocalNotifications.schedule({
      notifications: upcoming.map((a) => ({
        id: numericId(a.id),
        title: timerName,
        body: a.message,
        schedule: {
          at: new Date(Date.now() + (liveRemainingSeconds - a.remaining_seconds) * 1000),
          allowWhileIdle: true,
        },
      })),
    });
  } catch {
    // Same best-effort fallback as scheduleTimerAlarm.
  }
}

export async function cancelTimerAlerts(alertIds: string[]) {
  if (!Capacitor.isNativePlatform() || alertIds.length === 0) return;
  try {
    await LocalNotifications.cancel({ notifications: alertIds.map((id) => ({ id: numericId(id) })) });
  } catch {
    // Nothing to cancel, or the plugin isn't available — either way, fine.
  }
}

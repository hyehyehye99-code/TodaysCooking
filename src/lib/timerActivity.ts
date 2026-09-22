import { toPlainEmoji } from "@/lib/mascotIcon";
import { Capacitor, registerPlugin } from "@capacitor/core";

interface TimerActivityPlugin {
  start(options: {
    id: string;
    name: string;
    iconEmoji: string;
    endEpochMs: number;
    isPaused: boolean;
  }): Promise<void>;
  end(options: { id: string }): Promise<void>;
  endAll(): Promise<void>;
}

// Only ever present in the native iOS build (TimerActivityPlugin.swift,
// ios/App/App) — registerPlugin's web fallback throws on every call when
// there's no such plugin, which the isNativePlatform() guards below skip.
const TimerActivity = registerPlugin<TimerActivityPlugin>("TimerActivity");

// Drives the Dynamic Island / Lock Screen Live Activity. Purely cosmetic —
// every call is best-effort so a missing plugin (e.g. an older TestFlight
// build) or a device below iOS 16.2 never blocks the actual timer logic.
export async function startTimerActivity(input: {
  id: string;
  name: string;
  iconEmoji: string | null;
  endEpochMs: number;
  isPaused?: boolean;
}) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await TimerActivity.start({
      id: input.id,
      name: input.name,
      iconEmoji: toPlainEmoji(input.iconEmoji),
      endEpochMs: input.endEpochMs,
      isPaused: input.isPaused ?? false,
    });
  } catch {
    // No native plugin in this build — the in-app UI and the local
    // notification alarm are unaffected.
  }
}

export async function endTimerActivity(id: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await TimerActivity.end({ id });
  } catch {
    // Nothing to end, or the plugin isn't available — either way, fine.
  }
}

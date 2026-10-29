import Link from "next/link";
import type { AssistantUsage } from "@/lib/assistant/types";

// Usage is shown as a share of the weekly free allowance, not a raw count —
// so the allowance can change later without the UI having to.
export function UsageChip({ usage }: { usage: AssistantUsage }) {
  if (usage.unlimited) return null;
  const bonus = usage.bonusRemaining > 0;
  const tone = bonus
    ? "bg-emerald-50 text-emerald-700"
    : usage.percent >= 100
      ? "bg-red-50 text-red-600"
      : usage.percent >= 80
        ? "bg-accent/10 text-accent"
        : "bg-stone-100 text-stone-500";
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>
      {bonus ? `보너스 ${usage.bonusRemaining}회` : `AI ${usage.percent}%`}
    </span>
  );
}

// Appears as the allowance runs low (or out) and points at inviting friends.
export function UsageNudge({ usage, limitReached }: { usage: AssistantUsage; limitReached: boolean }) {
  if (usage.unlimited || usage.bonusRemaining > 0) return null;
  const out = limitReached || usage.percent >= 100;
  if (!out && usage.percent < 80) return null;
  return (
    <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-stone-800">
          {out ? "이번 주 AI 사용량을 다 썼어요" : `이번 주 AI 사용량 ${usage.percent}%`}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200/70">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, usage.percent)}%` }} />
        </div>
      </div>
      <Link
        href="/mypage/usage"
        className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-xs font-bold text-white active:scale-95"
      >
        티켓 받기
      </Link>
    </div>
  );
}

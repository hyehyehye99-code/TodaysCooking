"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { useDict } from "@/lib/i18n/client";

type ActivityEntry = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  actor_user_id: string;
  created_at: string;
};

// Safe to compute plainly at render time: this list is only ever rendered
// client-side after the initial server render already resolved, no SSR/
// client mismatch risk (same reasoning as share-menu-button.tsx's copy).
function relativeTimeFrom(iso: string, dict: ReturnType<typeof useDict>) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return dict.mypage.timeJustNow;
  if (minutes < 60) return dict.mypage.timeMinutesAgoTemplate.replace("{n}", String(minutes));
  if (minutes < 60 * 24) return dict.mypage.timeHoursAgoTemplate.replace("{n}", String(Math.floor(minutes / 60)));
  return dict.mypage.timeDaysAgoTemplate.replace("{n}", String(Math.floor(minutes / (60 * 24))));
}

function ActivityRow({ entry, dict }: { entry: ActivityEntry; dict: ReturnType<typeof useDict> }) {
  const body = (
    <div className="px-4 py-3.5">
      <p className="text-sm font-bold text-ink">{entry.title}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{entry.body}</p>
      <p className="mt-1 text-[11px] text-ink-faint">{relativeTimeFrom(entry.created_at, dict)}</p>
    </div>
  );

  if (entry.url) {
    return (
      <Link href={entry.url} className="block">
        {body}
      </Link>
    );
  }

  return body;
}

export function ActivityList({ activity }: { activity: ActivityEntry[] }) {
  const dict = useDict();

  if (activity.length === 0) {
    return <p className="mt-10 text-center text-sm text-ink-soft">{dict.mypage.noActivity}</p>;
  }

  return (
    <GlassCard className="bg-white">
      <div className="divide-y divide-border">
        {activity.map((entry) => (
          <ActivityRow key={entry.id} entry={entry} dict={dict} />
        ))}
      </div>
    </GlassCard>
  );
}

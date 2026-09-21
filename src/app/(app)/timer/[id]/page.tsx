import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { TimerDetail } from "./timer-detail";
import type { TimerDetailData } from "./timer-detail";

export default async function TimerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="timer" />;
  const supabase = await createClient();

  const { data: timer } = await supabase
    .from("timers")
    .select(
      "*, recipes(title, cover_photo_urls, icon_emoji, bookmarks(thumbnail_url)), timer_alerts(id, timer_id, remaining_seconds, message)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!timer) notFound();

  return <TimerDetail timer={timer as TimerDetailData} />;
}

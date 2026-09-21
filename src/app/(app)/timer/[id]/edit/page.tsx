import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { TimerForm } from "../../timer-form";
import type { RecipeOption, EditableTimer } from "../../timer-form";

export default async function EditTimerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="timer" />;
  const supabase = await createClient();

  const [{ data: timer }, { data: recipes }] = await Promise.all([
    supabase
      .from("timers")
      .select(
        "id, name, icon_emoji, duration_seconds, recipe_id, is_running, timer_alerts(id, timer_id, remaining_seconds, message)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipes")
      .select("id, title, cover_photo_urls, icon_emoji, is_cooking, bookmarks(thumbnail_url)")
      .eq("household_id", household!.id)
      .not("title", "is", null)
      .order("is_cooking", { ascending: false })
      .order("title", { ascending: true }),
  ]);

  if (!timer) notFound();

  return (
    <TimerForm recipes={(recipes as RecipeOption[] | null) ?? []} timer={timer as EditableTimer} />
  );
}

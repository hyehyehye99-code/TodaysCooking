import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { LoginPrompt } from "@/components/LoginPrompt";
import { TimerList } from "./timer-list";
import type { TimerWithRecipe } from "@/lib/types";

export default async function TimerPage() {
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="timer" />;
  const supabase = await createClient();

  const { data: timers } = await supabase
    .from("timers")
    .select("*, recipes(title), timer_alerts(id, timer_id, remaining_seconds, message)")
    .eq("household_id", household!.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <TimerList householdId={household!.id} timers={(timers as TimerWithRecipe[] | null) ?? []} />
    </div>
  );
}

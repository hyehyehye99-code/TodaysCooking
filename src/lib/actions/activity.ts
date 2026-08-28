"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToHousehold } from "@/lib/actions/push";

// Writes one shared household_activity row (visible to every member,
// including whoever triggered it) and, separately, pushes to every OTHER
// member's device if they have push enabled. Fire-and-forget from the
// caller: never let this affect the mutation that triggered it.
export async function notifyHousehold(
  householdId: string,
  actorUserId: string,
  notification: { title: string; body: string; url?: string }
) {
  const supabase = await createClient();

  await supabase.from("household_activity").insert({
    household_id: householdId,
    actor_user_id: actorUserId,
    title: notification.title,
    body: notification.body,
    url: notification.url ?? null,
  });

  await sendPushToHousehold(householdId, actorUserId, notification);
}

export async function getHouseholdActivity(householdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_activity")
    .select("id, title, body, url, actor_user_id, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(100);

  return data ?? [];
}

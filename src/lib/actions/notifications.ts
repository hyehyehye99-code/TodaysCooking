"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToHousehold } from "@/lib/actions/push";

// Fans a notification out to every other household member — writes one
// in-app notifications row each (via the notify_household security-definer
// RPC, since a plain RLS policy can't let one user insert rows for another)
// and, separately, sends a web push to whichever of them have it enabled.
// Fire-and-forget from the caller: never let this affect the mutation that
// triggered it.
export async function notifyHousehold(
  householdId: string,
  actorUserId: string,
  notification: { title: string; body: string; url?: string }
) {
  const supabase = await createClient();

  await supabase.rpc("notify_household", {
    p_household_id: householdId,
    p_exclude_user_id: actorUserId,
    p_title: notification.title,
    p_body: notification.body,
    p_url: notification.url ?? null,
  });

  await sendPushToHousehold(householdId, actorUserId, notification);
}

export async function getMyNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, url, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count ?? 0;
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/mypage");
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", id);
  revalidatePath("/mypage/notifications");
  revalidatePath("/mypage");
}

export async function deleteAllNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").delete().eq("user_id", user.id);
  revalidatePath("/mypage/notifications");
  revalidatePath("/mypage");
}

"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_HOUSEHOLD_COOKIE = "active_household_id";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Without this, the cookie survives into the next sign-in on this same
  // device/browser. If that's a different account with no households of its
  // own yet, getCurrentHousehold() finds the leftover id, can't resolve it
  // to a membership, and reports previousHouseholdMissing — so a genuinely
  // brand-new sign-up sees "이전에 참여 중이던 부엌을 더 이상 이용할 수
  // 없어요" instead of going straight into onboarding.
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_HOUSEHOLD_COOKIE);

  redirect("/login");
}

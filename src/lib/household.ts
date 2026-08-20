import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_HOUSEHOLD_COOKIE = "active_household_id";

type HouseholdRow = { id: string; name: string; invite_code: string };

function unwrapHousehold(value: unknown) {
  const household = Array.isArray(value) ? value[0] : value;
  return (household as HouseholdRow | null) ?? null;
}

// Deduped per-request: layout + page both call getCurrentHousehold(), and
// getMyHouseholds() needs the same user — cache() makes repeats free instead
// of re-hitting Supabase Auth/DB for each caller in the same render.
const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// getCurrentHousehold() and getMyHouseholds() both used to run their own
// household_members query — every page paid for two round trips to resolve
// "which household am I in" instead of one. They now share this single
// membership fetch (cache()-deduped per request) and each derive their
// answer from it in memory.
const getMyMemberships = cache(async () => {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("role, households(id, name, invite_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  return (data ?? [])
    .map((m) => ({ role: m.role as string, household: unwrapHousehold(m.households) }))
    .filter((m): m is { role: string; household: HouseholdRow } => !!m.household);
});

export const getCurrentHousehold = cache(async () => {
  const user = await getAuthUser();
  if (!user) return { user: null, household: null, previousHouseholdMissing: false };

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_HOUSEHOLD_COOKIE)?.value;
  const memberships = await getMyMemberships();

  const active = activeId ? memberships.find((m) => m.household.id === activeId) : undefined;
  if (active) return { user, household: active.household, previousHouseholdMissing: false };

  // activeId pointed at a household this user can no longer see — either it
  // was deleted (owner left solo, or delete_my_account handed it off/wiped
  // it) or they were removed as a member — so the caller should tell them
  // they landed somewhere else instead of silently swapping households.
  const fallback = memberships[0];
  return {
    user,
    household: fallback ? fallback.household : null,
    previousHouseholdMissing: !!activeId,
  };
});

export const getMyHouseholds = cache(async () => {
  const user = await getAuthUser();
  if (!user) return [];
  return getMyMemberships();
});

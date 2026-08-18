import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_HOUSEHOLD_COOKIE = "active_household_id";

function unwrapHousehold(value: unknown) {
  const household = Array.isArray(value) ? value[0] : value;
  return (household as { id: string; name: string } | null) ?? null;
}

export async function getCurrentHousehold() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, household: null };

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_HOUSEHOLD_COOKIE)?.value;

  if (activeId) {
    const { data } = await supabase
      .from("household_members")
      .select("households(id, name)")
      .eq("user_id", user.id)
      .eq("household_id", activeId)
      .maybeSingle();

    const household = data ? unwrapHousehold(data.households) : null;
    if (household) return { user, household };
  }

  const { data: fallback } = await supabase
    .from("household_members")
    .select("households(id, name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { user, household: fallback ? unwrapHousehold(fallback.households) : null };
}

export async function getMyHouseholds() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("household_members")
    .select("role, households(id, name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  return (data ?? [])
    .map((m) => ({ role: m.role as string, household: unwrapHousehold(m.households) }))
    .filter((m): m is { role: string; household: { id: string; name: string } } => !!m.household);
}

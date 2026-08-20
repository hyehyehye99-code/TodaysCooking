"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_HOUSEHOLD_COOKIE = "active_household_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

async function setActiveHouseholdCookie(householdId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_HOUSEHOLD_COOKIE, householdId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

async function clearActiveHouseholdCookieIfMatches(householdId: string) {
  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_HOUSEHOLD_COOKIE)?.value === householdId) {
    cookieStore.delete(ACTIVE_HOUSEHOLD_COOKIE);
  }
}

export async function createHousehold(_prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "이름을 입력해주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_household", {
    household_name: name,
  });

  if (error) return { error: "부엌을 만들지 못했어요. 다시 시도해주세요." };
  if (data) await setActiveHouseholdCookie(data as string);

  redirect("/recipes");
}

export async function joinHousehold(_prevState: unknown, formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "초대 코드를 입력해주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_household_with_code", {
    p_invite_code: code,
  });

  if (error) return { error: "초대 코드가 올바르지 않아요." };
  if (data) await setActiveHouseholdCookie(data as string);

  redirect("/recipes");
}

export async function removeMember(formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!householdId || !userId) return;

  const supabase = await createClient();
  await supabase.rpc("remove_household_member", {
    target_household_id: householdId,
    target_user_id: userId,
  });

  revalidatePath("/mypage");
}

export async function renameHousehold(_prevState: unknown, formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!householdId) return { error: "부엌을 찾을 수 없어요." };
  if (!name) return { error: "이름을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("households").update({ name }).eq("id", householdId);
  if (error) return { error: "이름을 저장하지 못했어요." };

  revalidatePath("/mypage");
  return { success: true as const };
}

export async function switchHousehold(formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  if (!householdId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("household_id", householdId)
    .maybeSingle();

  if (!data) return;

  await setActiveHouseholdCookie(householdId);
  redirect("/recipes");
}

// Called from the "이전 부엌이 사라졌어요" notice's 확인 button: persists the
// household the user was silently moved to (or clears the stale cookie if
// they had none left, en route to onboarding) so the notice doesn't reappear
// on the next page load.
export async function acknowledgeHouseholdChange(formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  if (householdId) {
    await setActiveHouseholdCookie(householdId);
  } else {
    const cookieStore = await cookies();
    cookieStore.delete(ACTIVE_HOUSEHOLD_COOKIE);
  }
}

export async function leaveHousehold(formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  if (!householdId) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_household", {
    target_household_id: householdId,
  });
  if (error) return;

  await clearActiveHouseholdCookieIfMatches(householdId);
  redirect("/");
}

// Hands off ownership (to whoever joined each owned household earliest) or
// deletes households with no one left, then deletes the auth.users row
// itself — see delete_my_account() in supabase/migrations.
export async function deleteMyAccount(): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "탈퇴하지 못했어요. 다시 시도해주세요." };

  await supabase.auth.signOut();
  redirect("/login");
}

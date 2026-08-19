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
    invite_code: code,
  });

  if (error) return { error: "초대 코드가 올바르지 않거나 만료되었어요." };
  if (data) await setActiveHouseholdCookie(data as string);

  redirect("/recipes");
}

export async function createInvite(_prevState: unknown, formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  if (!householdId) return { error: "부엌을 찾을 수 없어요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { error } = await supabase.from("household_invites").insert({
    household_id: householdId,
    code,
    created_by: user.id,
  });

  if (error) return { error: "초대 코드를 만들지 못했어요." };

  revalidatePath("/mypage");
  return { code };
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

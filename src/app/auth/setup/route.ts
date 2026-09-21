import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { HOUSEHOLD_SETUP_FAILED_COOKIE } from "@/lib/constants";

const DEFAULT_HOUSEHOLD_NAME = "우리집";

// Replaces the old /onboarding wizard: a signed-in user who has no household
// yet (first login, or they just left their last one) gets one created here
// with defaults, and lands straight in the app. The name and nickname are
// both editable later from mypage.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/recipes`);

  // A repeated or racing hit on this route (double navigation, duplicate
  // native callback) must not create a second household.
  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!existing?.length) {
    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
    if (!profile?.nickname?.trim()) {
      const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
      const fallback = meta?.full_name || meta?.name || user.email?.split("@")[0] || "요리사";
      await supabase.rpc("upsert_my_nickname", { new_nickname: fallback.trim().slice(0, 20) });
    }

    // complete_onboarding_create() is atomic per user (migration 0047) but
    // only ever creates ONE household per user, ever — its claim row is never
    // cleared. For someone who has since left/lost every household it just
    // returns null, so fall back to a plain create_household() for them.
    let { data: householdId } = await supabase.rpc("complete_onboarding_create", {
      household_name: DEFAULT_HOUSEHOLD_NAME,
    });
    if (!householdId) {
      ({ data: householdId } = await supabase.rpc("create_household", { household_name: DEFAULT_HOUSEHOLD_NAME }));
    }

    if (!householdId) {
      // Without this, (app)/layout.tsx would bounce straight back here and
      // loop forever — the cookie makes it show a retry screen instead.
      const response = NextResponse.redirect(`${origin}/recipes`);
      response.cookies.set(HOUSEHOLD_SETUP_FAILED_COOKIE, "1", { maxAge: 60, path: "/" });
      return response;
    }
  }

  revalidatePath("/", "layout");
  const response = NextResponse.redirect(`${origin}/recipes`);
  response.cookies.delete(HOUSEHOLD_SETUP_FAILED_COOKIE);
  return response;
}

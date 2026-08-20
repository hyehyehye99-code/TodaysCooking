import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PENDING_INVITE_COOKIE = "pending_invite_code";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const pendingInviteCode = request.cookies.get(PENDING_INVITE_COOKIE)?.value;
      if (pendingInviteCode) {
        await supabase.rpc("join_household_with_code", { p_invite_code: pendingInviteCode });
        const response = NextResponse.redirect(`${origin}/recipes`);
        response.cookies.delete(PENDING_INVITE_COOKIE);
        return response;
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

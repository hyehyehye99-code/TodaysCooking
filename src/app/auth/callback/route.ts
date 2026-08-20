import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PENDING_INVITE_COOKIE = "pending_invite_code";
const POST_LOGIN_REDIRECT_COOKIE = "post_login_redirect";

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

      // Used by the public share page: a visitor who logs in just to react
      // isn't joining anything, so send them back where they were instead
      // of into the app. Restricted to /share/ so this cookie (client-set)
      // can't be abused as an open redirect to an off-site URL.
      const postLoginRedirect = request.cookies.get(POST_LOGIN_REDIRECT_COOKIE)?.value;
      if (postLoginRedirect && postLoginRedirect.startsWith("/share/")) {
        const response = NextResponse.redirect(`${origin}${postLoginRedirect}`);
        response.cookies.delete(POST_LOGIN_REDIRECT_COOKIE);
        return response;
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

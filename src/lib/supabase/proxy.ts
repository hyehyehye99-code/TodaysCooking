import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // A guest (no login) has no Supabase auth cookie at all — supabase.auth.
  // getUser() below can only ever come back empty for them, so there's no
  // reason to pay for that network round trip to Supabase's Auth server on
  // every single page load. This is the single biggest per-navigation cost
  // in the app, and guests are the default now (see guest mode), so this
  // skips it for the common case instead of just the logged-in one.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // touching the session refreshes it and re-issues cookies when expired
  await supabase.auth.getUser();

  return response;
}

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// The native iOS app authenticates with a Supabase access token instead of a
// browser cookie jar, sent as `Authorization: Bearer <token>`. Returns null
// for ordinary (cookie) web requests, so nothing changes for them.
export async function getBearerToken(): Promise<string | null> {
  const value = (await headers()).get("authorization");
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function createClient() {
  const cookieStore = await cookies();
  const bearer = await getBearerToken();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // With a bearer token every PostgREST call runs as that user, so RLS
      // applies exactly as it does for the cookie session.
      ...(bearer ? { global: { headers: { Authorization: `Bearer ${bearer}` } } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component render — the proxy refreshes
            // the session on the next request instead.
          }
        },
      },
    }
  );
}

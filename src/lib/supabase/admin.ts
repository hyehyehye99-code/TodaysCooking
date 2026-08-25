import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only for server-to-server
// contexts with no user session (e.g. the RevenueCat webhook), where the
// cookie-bound createClient() in ./server.ts has no auth to work with.
// Never import this from anywhere a user request could reach without its
// own separate authorization check.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

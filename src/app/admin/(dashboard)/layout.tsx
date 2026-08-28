import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav } from "./admin-nav";

// Auth is checked once here for every page under this group instead of
// each page repeating the same redirect — the Server Actions in
// lib/actions/admin.ts still guard themselves independently, since those
// are reachable directly regardless of what page rendered the button.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("creator_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div>
      <AdminNav pendingApplicationCount={count ?? 0} />
      <div className="mt-6">{children}</div>
    </div>
  );
}

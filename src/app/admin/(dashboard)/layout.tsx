import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "./admin-shell";

// Auth is checked once here for every page under this group instead of
// each page repeating the same redirect — the Server Actions in
// lib/actions/admin.ts still guard themselves independently, since those
// are reachable directly regardless of what page rendered the button.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createAdminClient();
  const [{ count: pendingApplications }, { count: openInquiries }, { count: aiReports }] = await Promise.all([
    supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("ai_recipe_reports").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AdminShell
      badges={{
        applications: pendingApplications ?? 0,
        inquiries: openInquiries ?? 0,
        aiReports: aiReports ?? 0,
      }}
    >
      {children}
    </AdminShell>
  );
}

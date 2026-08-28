import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "./admin-sidebar";

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
    <div className="flex min-h-dvh">
      <AdminSidebar pendingApplicationCount={count ?? 0} />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto w-full max-w-[880px]">{children}</div>
      </main>
    </div>
  );
}

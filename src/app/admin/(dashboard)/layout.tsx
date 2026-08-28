import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminNav } from "./admin-nav";

// Auth is checked once here for every page under this group instead of
// each page repeating the same redirect — the Server Actions in
// lib/actions/admin.ts still guard themselves independently, since those
// are reachable directly regardless of what page rendered the button.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <div>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const [{ data: usersData }, { data: profiles }] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nickname, icon_emoji"),
  ]);

  const profileById = new Map(
    ((profiles as { id: string; nickname: string; icon_emoji: string | null }[] | null) ?? []).map((p) => [p.id, p])
  );
  const users = [...usersData.users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((u) => {
      const profile = profileById.get(u.id);
      return {
        id: u.id,
        nickname: profile?.nickname ?? null,
        icon_emoji: profile?.icon_emoji ?? null,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">사용자 리스트 ({users.length}명)</h1>
        <a
          href="/admin/users/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      <UsersTable users={users} />
    </div>
  );
}

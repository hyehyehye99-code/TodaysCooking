import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const [{ data: usersData }, { data: profiles }] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nickname, icon_emoji"),
  ]);

  const profileById = new Map(
    ((profiles as { id: string; nickname: string; icon_emoji: string | null }[] | null) ?? []).map((p) => [p.id, p])
  );
  const users = [...usersData.users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">전체 유저 ({users.length}명)</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
              <th className="w-10 px-3 py-2 font-semibold" />
              <th className="px-3 py-2 font-semibold">닉네임</th>
              <th className="px-3 py-2 font-semibold">이메일</th>
              <th className="px-3 py-2 font-semibold">가입일</th>
              <th className="px-3 py-2 font-semibold">마지막 로그인</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const profile = profileById.get(u.id);
              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-lg">{profile?.icon_emoji ?? "👤"}</td>
                  <td className="px-3 py-2 font-bold">{profile?.nickname ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{u.email ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{new Date(u.created_at).toLocaleDateString("ko-KR")}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ko-KR") : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  nickname: string | null;
  icon_emoji: string | null;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.nickname ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
    );
  }, [query, users]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="닉네임 또는 이메일로 검색"
        className="mb-3 w-full max-w-sm rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">검색 결과가 없어요.</p>
      ) : (
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
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-lg">{u.icon_emoji ?? "👤"}</td>
                  <td className="px-3 py-2 font-bold">{u.nickname ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{u.email ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{new Date(u.created_at).toLocaleDateString("ko-KR")}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ko-KR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

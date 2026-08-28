"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantPromoToUser } from "@/lib/actions/admin";
import type { PromoCode, PromoUser } from "./page";

export function PromoGrantPanel({ users, codes }: { users: PromoUser[]; codes: PromoCode[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<PromoUser | null>(null);
  const [code, setCode] = useState(codes[0]?.code ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) => (u.nickname ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, users]);

  function handleGrant() {
    if (!selectedUser || !code) return;
    setMessage(null);
    startTransition(async () => {
      const res = await grantPromoToUser(selectedUser.id, code);
      if ("error" in res) {
        setMessage({ type: "error", text: res.error });
        return;
      }
      setMessage({ type: "ok", text: `${selectedUser.nickname ?? selectedUser.email}님에게 지급했어요.` });
      setSelectedUser(null);
      setQuery("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      {selectedUser ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5">
          <div>
            <p className="text-sm font-bold">{selectedUser.nickname ?? "닉네임 없음"}</p>
            <p className="text-xs text-ink-soft">{selectedUser.email ?? "-"}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="text-xs font-bold text-ink-faint"
          >
            변경
          </button>
        </div>
      ) : (
        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임 또는 이메일로 유저 검색"
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setQuery("");
                  }}
                  className="flex w-full flex-col items-start px-3.5 py-2.5 text-left hover:bg-surface"
                >
                  <span className="text-sm font-bold">{u.nickname ?? "닉네임 없음"}</span>
                  <span className="text-xs text-ink-soft">{u.email ?? "-"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={codes.length === 0}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
        >
          {codes.length === 0 ? (
            <option value="">사용 가능한 코드가 없어요</option>
          ) : (
            codes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.duration_days ? `${c.duration_days}일` : "무제한"})
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={handleGrant}
          disabled={!selectedUser || !code || pending}
          className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "지급하는 중..." : "지급"}
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-xs font-semibold ${message.type === "error" ? "text-warn-ink" : "text-positive-ink"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

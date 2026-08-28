"use client";

import { useMemo, useState, useTransition } from "react";
import { revokePromoRedemption } from "@/lib/actions/admin";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { PromoRedemption, PromoUser } from "./page";

function RevokeButton({ userId, label }: { userId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await revokePromoRedemption(userId);
      setOpen(false);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-warn-ink">
        회수
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title={`${label}님의 프로모션을 회수할까요?`}
        confirmSlot={
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "회수하는 중..." : "회수"}
          </button>
        }
      />
    </>
  );
}

export function PromoRedemptionsTable({
  redemptions,
  users,
}: {
  redemptions: PromoRedemption[];
  users: PromoUser[];
}) {
  const [query, setQuery] = useState("");
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return redemptions;
    return redemptions.filter((r) => {
      const u = userById.get(r.user_id);
      return (
        (u?.nickname ?? "").toLowerCase().includes(q) ||
        (u?.email ?? "").toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
      );
    });
  }, [query, redemptions, userById]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="닉네임, 이메일, 코드로 검색"
        className="mb-3 w-full max-w-sm rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">{redemptions.length === 0 ? "아직 지급된 프로모션이 없어요." : "검색 결과가 없어요."}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">유저</th>
                <th className="px-3 py-2 font-semibold">코드</th>
                <th className="px-3 py-2 font-semibold">지급 방식</th>
                <th className="px-3 py-2 font-semibold">만료일</th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const u = userById.get(r.user_id);
                const label = u?.nickname ?? u?.email ?? r.user_id;
                const expired = r.expires_at ? new Date(r.expires_at) < new Date() : false;
                return (
                  <tr key={r.user_id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-3 py-2">
                      <p className="font-bold">{u?.nickname ?? "닉네임 없음"}</p>
                      <p className="text-xs text-ink-soft">{u?.email ?? "-"}</p>
                    </td>
                    <td className="px-3 py-2 font-semibold">{r.code}</td>
                    <td className="px-3 py-2 text-ink-soft">{r.granted_by === "admin" ? "관리자 지급" : "직접 입력"}</td>
                    <td className={`px-3 py-2 ${expired ? "text-ink-faint" : "text-ink-soft"}`}>
                      {r.expires_at ? `${new Date(r.expires_at).toLocaleDateString("ko-KR")}${expired ? " (만료)" : ""}` : "무제한"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <RevokeButton userId={r.user_id} label={label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

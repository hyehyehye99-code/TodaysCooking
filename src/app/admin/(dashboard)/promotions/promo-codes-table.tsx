"use client";

import { useState, useTransition } from "react";
import { togglePromoCodeActive, deletePromoCode } from "@/lib/actions/admin";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { PromoCode } from "./page";

function ToggleButton({ code, active }: { code: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => togglePromoCodeActive(code, !active))}
      disabled={pending}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-60 ${
        active ? "bg-positive/10 text-positive-ink" : "bg-surface text-ink-faint"
      }`}
    >
      {active ? "사용중" : "중지됨"}
    </button>
  );
}

function DeleteButton({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await deletePromoCode(code);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="text-xs font-bold text-ink-faint"
      >
        삭제
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title={`"${code}" 코드를 삭제할까요?`}
        confirmSlot={
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "삭제하는 중..." : "삭제"}
          </button>
        }
      >
        {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
      </ConfirmModal>
    </>
  );
}

export function PromoCodesTable({
  codes,
  redemptionCountByCode,
}: {
  codes: PromoCode[];
  redemptionCountByCode: Record<string, number>;
}) {
  if (codes.length === 0) return <p className="text-sm text-ink-soft">아직 만든 코드가 없어요.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
            <th className="px-3 py-2 font-semibold">코드</th>
            <th className="px-3 py-2 font-semibold">메모</th>
            <th className="px-3 py-2 font-semibold">기간</th>
            <th className="px-3 py-2 text-right font-semibold">지급 수</th>
            <th className="px-3 py-2 font-semibold">상태</th>
            <th className="w-16 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code} className="border-b border-border last:border-0 hover:bg-surface">
              <td className="px-3 py-2 font-bold">{c.code}</td>
              <td className="max-w-[220px] truncate px-3 py-2 text-ink-soft">{c.note ?? "-"}</td>
              <td className="px-3 py-2 text-ink-soft">{c.duration_days ? `${c.duration_days}일` : "무제한"}</td>
              <td className="px-3 py-2 text-right text-ink-soft">{redemptionCountByCode[c.code] ?? 0}</td>
              <td className="px-3 py-2">
                <ToggleButton code={c.code} active={c.active} />
              </td>
              <td className="px-3 py-2 text-right">
                <DeleteButton code={c.code} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

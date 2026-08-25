"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemPromoCode } from "@/lib/actions/promo";
import { Modal } from "@/components/Modal";

export function PromoCodeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    setError(null);
    const result = await redeemPromoCode(code);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setCode("");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-ink-faint underline">
        프로모션 코드가 있으신가요?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="center">
        <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">프로모션 코드 입력</p>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="코드 입력"
            className="mt-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl bg-surface py-2.5 text-xs font-bold text-ink-soft"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={sending || !code.trim()}
              className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {sending ? "확인하는 중..." : "적용하기"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

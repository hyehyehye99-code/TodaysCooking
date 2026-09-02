"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/lib/actions/household";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

export function DeleteAccountButton() {
  const dict = useDict();
  const CONFIRM_WORD = dict.mypage.deleteConfirmWord;
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setConfirming(false);
    setTyped("");
    setError(null);
  }

  function doDelete() {
    startTransition(async () => {
      const result = await deleteMyAccount();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-ink-faint"
      >
        {dict.mypage.deleteAccount}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <ConfirmModal
        open={confirming}
        onClose={close}
        title={dict.mypage.deleteAccountTitle}
        description={dict.mypage.deleteAccountDesc}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={typed !== CONFIRM_WORD || pending}
            className="rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            {pending ? dict.mypage.deletingAccount : dict.mypage.deleteAccountConfirm}
          </button>
        }
      >
        <p className="mt-3 text-xs text-ink-soft">
          {(() => {
            const [prefix, suffix] = dict.mypage.typeToConfirmTemplate.split("{word}");
            return (
              <>
                {prefix}
                <span className="font-bold text-ink">{CONFIRM_WORD}</span>
                {suffix}
              </>
            );
          })()}
        </p>
        <ClearableInput
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="mt-3 w-full rounded-lg border border-transparent bg-surface px-3 py-2.5 text-sm outline-none focus:border-ink-soft"
        />
        {error && <p className="mt-2 text-xs text-warn-ink">{error}</p>}
      </ConfirmModal>
    </>
  );
}

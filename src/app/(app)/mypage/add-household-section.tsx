"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { createHousehold, joinHousehold } from "@/lib/actions/household";
import { useDict } from "@/lib/i18n/client";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export function AddHouseholdSection() {
  const dict = useDict();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-bold text-accent"
      >
        + {dict.mypage.addHousehold}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-[420px] flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold">{dict.mypage.addHousehold}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-faint underline"
            >
              {dict.common.close}
            </button>
          </div>

          <GlassCard className="bg-white p-4">
            <p className="mb-3 text-[13px] font-bold">{dict.mypage.createNewHousehold}</p>
            <CreateHouseholdForm action={createHousehold} />
          </GlassCard>

          <GlassCard className="bg-white p-4">
            <p className="mb-3 text-[13px] font-bold">{dict.mypage.joinByCode}</p>
            <JoinHouseholdForm action={joinHousehold} />
          </GlassCard>
        </div>
      </Modal>
    </>
  );
}

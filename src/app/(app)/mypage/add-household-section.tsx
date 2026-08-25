"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { createHousehold, joinHousehold } from "@/lib/actions/household";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export function AddHouseholdSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-bold text-accent"
      >
        + 우리집 추가
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[85vh] w-full max-w-[420px] flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold">우리집 추가</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-faint underline"
            >
              닫기
            </button>
          </div>

          <GlassCard className="bg-white p-4">
            <p className="mb-3 text-[13px] font-bold">새 우리집 만들기</p>
            <CreateHouseholdForm action={createHousehold} />
          </GlassCard>

          <GlassCard className="bg-white p-4">
            <p className="mb-3 text-[13px] font-bold">코드로 참여하기</p>
            <JoinHouseholdForm action={joinHousehold} />
          </GlassCard>
        </div>
      </Modal>
    </>
  );
}

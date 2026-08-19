"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { createHousehold, joinHousehold } from "@/lib/actions/household";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export function AddHouseholdSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-bold text-accent"
      >
        + 부엌 추가
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink-soft">부엌 추가</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-faint underline"
        >
          닫기
        </button>
      </div>

      <GlassCard className="bg-white p-4">
        <p className="mb-3 text-[13px] font-bold">새 부엌 만들기</p>
        <CreateHouseholdForm action={createHousehold} />
      </GlassCard>

      <GlassCard className="bg-white p-4">
        <p className="mb-3 text-[13px] font-bold">코드로 참여하기</p>
        <JoinHouseholdForm action={joinHousehold} />
      </GlassCard>
    </div>
  );
}

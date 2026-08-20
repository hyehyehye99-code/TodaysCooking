"use client";

import { finishShoppingTrip } from "@/lib/actions/shopping";
import { FixedBottomBar } from "@/components/FixedBottomBar";

export function FinishShoppingBar({ doneCount }: { doneCount: number }) {
  if (doneCount === 0) return null;

  return (
    <FixedBottomBar>
      <form action={finishShoppingTrip}>
        <button
          type="submit"
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white"
        >
          오늘 장보기 끝내기
        </button>
        <p className="mt-2 text-center text-xs text-ink-faint">
          체크한 {doneCount}개 재료가 냉장고로 이동해요
        </p>
      </form>
    </FixedBottomBar>
  );
}

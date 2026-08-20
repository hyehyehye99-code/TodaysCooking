"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishShoppingTrip } from "@/lib/actions/shopping";
import { FixedBottomBar } from "@/components/FixedBottomBar";

export function FinishShoppingBar({ doneCount }: { doneCount: number }) {
  const [pending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  if (doneCount === 0) return null;

  function handleFinish() {
    startTransition(async () => {
      await finishShoppingTrip();
      router.refresh();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  }

  return (
    <>
      <FixedBottomBar aboveTabBar>
        <button
          type="button"
          onClick={handleFinish}
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "처리 중..." : "오늘 장보기 끝내기"}
        </button>
        <p className="mt-2 text-center text-xs text-ink-faint">
          체크한 {doneCount}개 재료가 냉장고로 이동해요
        </p>
      </FixedBottomBar>

      {showToast && (
        <div className="fixed inset-x-0 bottom-[14rem] z-50 flex justify-center px-6">
          <div className="rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            냉장고에 재료를 추가했어요
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGuestData } from "@/lib/guest/useGuestData";
import { hasGuestData, clearGuestData } from "@/lib/guest/storage";
import { importGuestData } from "@/lib/actions/guest-import";

export function GuestImportPrompt() {
  const { data } = useGuestData();
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (dismissed || !hasGuestData(data)) return null;

  function handleImport() {
    startTransition(async () => {
      await importGuestData({
        recipes: data.recipes.map((r) => ({
          title: r.title,
          subtitle: r.subtitle,
          cookTimeMinutes: r.cookTimeMinutes,
          ingredients: r.ingredients,
        })),
        fridge: data.fridge,
        bookmarks: data.bookmarks.map((b) => ({
          url: b.url,
          title: b.title,
          domain: b.domain,
          thumbnailUrl: b.thumbnailUrl,
        })),
        shopping: data.shopping.map((s) => ({
          name: s.name,
          checked: s.checked,
          sourceRecipeTitle: s.sourceRecipeTitle,
        })),
      });
      clearGuestData();
      setDismissed(true);
      router.refresh();
    });
  }

  function handleSkip() {
    clearGuestData();
    setDismissed(true);
  }

  return (
    <div className="mb-5 rounded-2xl border border-transparent bg-accent/8 p-4">
      <p className="text-sm font-bold text-accent-ink">게스트 때 사용한 데이터가 있어요</p>
      <p className="mt-0.5 text-xs text-accent-ink/70">지금 요리책으로 가져올까요?</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSkip}
          className="flex-1 rounded-xl bg-white py-2 text-xs font-bold text-ink-soft"
        >
          건너뛰기
        </button>
        <button
          onClick={handleImport}
          disabled={pending}
          className="flex-1 rounded-xl bg-accent py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {pending ? "가져오는 중..." : "가져오기"}
        </button>
      </div>
    </div>
  );
}

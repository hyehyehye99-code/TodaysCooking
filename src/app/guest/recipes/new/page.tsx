"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGuestData } from "@/lib/guest/useGuestData";
import { GUEST_LIMITS, newId } from "@/lib/guest/storage";
import { PageHeader } from "@/components/ui";

export default function NewGuestRecipePage() {
  const { data, update, hydrated } = useGuestData();
  const router = useRouter();
  const [error, setError] = useState("");

  if (!hydrated) return null;

  if (data.recipes.length >= GUEST_LIMITS.recipes) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Link href="/guest/recipes" className="text-sm text-ink-soft">
            ← 취소
          </Link>
        </div>
        <PageHeader title="새 레시피" />
        <p className="text-sm text-ink-soft">
          게스트는 레시피를 최대 {GUEST_LIMITS.recipes}개까지 등록할 수 있어요. 더 등록하려면
          로그인해주세요.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-bold text-accent">
          로그인하기 →
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const subtitle = String(form.get("subtitle") ?? "").trim();
    const cookTime = String(form.get("cookTime") ?? "").trim();
    const ingredients = String(form.get("ingredients") ?? "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title) return setError("요리 이름을 입력해주세요.");
    if (ingredients.length === 0) return setError("재료를 한 개 이상 입력해주세요.");

    update((prev) => ({
      ...prev,
      recipes: [
        ...prev.recipes,
        {
          id: newId(),
          title,
          subtitle,
          cookTimeMinutes: cookTime ? Number(cookTime) : null,
          ingredients,
        },
      ],
    }));
    router.push("/guest/recipes");
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/guest/recipes" className="text-sm text-ink-soft">
          ← 취소
        </Link>
      </div>
      <PageHeader title="새 레시피" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">요리 이름</span>
          <input
            name="title"
            required
            placeholder="예) 김치찌개"
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">설명 (선택)</span>
          <input
            name="subtitle"
            placeholder="예) 얼큰하고 진한 국물 요리"
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">조리 시간(분, 선택)</span>
          <input
            name="cookTime"
            type="number"
            min="0"
            placeholder="예) 35"
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">재료 (한 줄에 하나씩)</span>
          <textarea
            name="ingredients"
            required
            rows={6}
            placeholder={"김치\n돼지고기\n두부\n대파\n마늘\n고추장"}
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        {error && <p className="text-sm text-warn-ink">{error}</p>}

        <button
          type="submit"
          className="mt-1 rounded-xl bg-accent py-3 text-sm font-bold text-white"
        >
          레시피 저장
        </button>
      </form>
    </div>
  );
}

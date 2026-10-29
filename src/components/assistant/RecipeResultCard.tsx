"use client";

import Link from "next/link";
import type { AssistantRecipeCard } from "@/lib/assistant/types";

export function RecipeResultCard({ card }: { card: AssistantRecipeCard }) {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-md shadow-stone-200/50">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
          {card.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-stone-800">{card.title}</p>
          {card.summary && <p className="mt-0.5 truncate text-xs text-stone-500">{card.summary}</p>}
        </div>
      </div>
      <IngredientRow names={card.ingredients} owned={card.totalCount > 0 ? card.ownedCount : null} total={card.totalCount} />
      <Link
        href={`/recipes/${card.id}`}
        className="mt-3 flex w-full items-center justify-center rounded-2xl bg-stone-800 py-3 text-sm font-bold text-white active:scale-[0.98]"
      >
        레시피 상세 보기 →
      </Link>
    </div>
  );
}

export function IngredientRow({
  names,
  owned,
  total,
}: {
  names: string[];
  owned: number | null;
  total: number;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {names.map((n) => (
        <span key={n} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
          {n}
        </span>
      ))}
      {owned !== null && owned > 0 && (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
          보유 {owned}/{total}
        </span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { AssistantIdea } from "@/lib/assistant/types";
import { IngredientRow } from "@/components/assistant/RecipeResultCard";

// A new-menu suggestion that isn't in the recipe book yet: shows the gist and
// a one-tap save (the idea is re-validated server-side before it's inserted).
export function IdeaCard({
  idea,
  onSave,
}: {
  idea: AssistantIdea;
  onSave: (idea: AssistantIdea) => Promise<string | null>;
}) {
  const [state, setState] = useState<{ status: "idle" | "saving" } | { status: "saved"; id: string }>({
    status: "idle",
  });
  const [open, setOpen] = useState(false);

  async function save() {
    setState({ status: "saving" });
    const id = await onSave(idea);
    setState(id ? { status: "saved", id } : { status: "idle" });
  }

  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-[#FBFBFA] p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
          {idea.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-stone-800">
            {idea.title} <span className="ml-1 text-[11px] font-semibold text-accent">NEW</span>
          </p>
          {idea.summary && <p className="mt-0.5 text-xs text-stone-500">{idea.summary}</p>}
        </div>
      </div>
      <IngredientRow names={idea.ingredients.slice(0, 6).map((i) => i.name)} owned={null} total={0} />
      {open && idea.instructions && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-white p-3 text-[13px] leading-relaxed text-stone-600">
          {idea.instructions}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {idea.instructions && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-600"
          >
            {open ? "접기" : "조리법"}
          </button>
        )}
        {state.status === "saved" ? (
          <Link
            href={`/recipes/${state.id}`}
            className="flex flex-1 items-center justify-center rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700"
          >
            저장됐어요 · 보러 가기 →
          </Link>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={state.status === "saving"}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {state.status === "saving" ? "저장 중..." : "내 레시피로 저장"}
          </button>
        )}
      </div>
    </div>
  );
}

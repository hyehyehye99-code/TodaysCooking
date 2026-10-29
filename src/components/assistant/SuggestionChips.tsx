"use client";

import { useState } from "react";
import type { AssistantAction } from "@/lib/assistant/types";

export function SuggestionChips({
  actions,
  onAddShopping,
  onPrompt,
}: {
  actions: AssistantAction[];
  onAddShopping: (action: Extract<AssistantAction, { kind: "add_shopping" }>) => Promise<boolean>;
  onPrompt: (action: Extract<AssistantAction, { kind: "prompt" }>) => void;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((a, i) => {
        const finished = done.has(i);
        return (
          <button
            key={i}
            type="button"
            disabled={finished}
            onClick={async () => {
              if (a.kind === "prompt") return onPrompt(a);
              if (await onAddShopping(a)) setDone((d) => new Set(d).add(i));
            }}
            className="rounded-full border border-stone-200/80 bg-white px-3.5 py-2 text-[13px] font-semibold text-stone-700 shadow-sm transition active:scale-95 disabled:bg-emerald-50 disabled:text-emerald-700"
          >
            {finished ? "✓ 담았어요" : a.label}
          </button>
        );
      })}
    </div>
  );
}

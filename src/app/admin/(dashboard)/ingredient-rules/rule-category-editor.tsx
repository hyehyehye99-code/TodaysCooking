"use client";

import { useState, useTransition } from "react";
import { addIngredientParseRule, deleteIngredientParseRule } from "@/lib/actions/admin";
import type { IngredientRuleType } from "@/lib/ingredientParsing";

type Rule = { id: string; value: string };

export function RuleCategoryEditor({
  type,
  title,
  description,
  defaults,
  rules,
  placeholder,
}: {
  type: IngredientRuleType;
  title: string;
  description: string;
  defaults: string[];
  rules: Rule[];
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setError("");
    startTransition(async () => {
      const result = await addIngredientParseRule(type, trimmed);
      if (!("success" in result)) {
        setError(result.error);
        return;
      }
      setValue("");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIngredientParseRule(id);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-ink-soft">{description}</p>

      <p className="mt-3 text-[11px] font-bold text-ink-faint">기본 제공</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {defaults.map((w) => (
          <span key={w} className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-faint">
            {w}
          </span>
        ))}
      </div>

      {rules.length > 0 && (
        <>
          <p className="mt-3 text-[11px] font-bold text-ink-faint">추가한 예외</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {rules.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1.5 rounded-full bg-accent/8 px-2.5 py-1 text-xs font-semibold text-accent-ink"
              >
                {r.value}
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  disabled={pending}
                  aria-label="삭제"
                  className="text-accent-ink/70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          추가
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-warn-ink">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";

// Suggests from the household's fridge item names so a recipe's ingredient
// list can be matched against fridge stock even when phrasing differs
// (e.g. picking "돼지고기" from the list instead of typing "돼지 앞다리살").
export function IngredientPicker({
  name,
  fridgeItems,
  defaultSelected = [],
}: {
  name: string;
  fridgeItems: string[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);

  const query = inputValue.trim().toLowerCase();
  const suggestions = query
    ? fridgeItems.filter((item) => item.toLowerCase().includes(query) && !selected.includes(item)).slice(0, 6)
    : [];

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    setSelected((prev) => [...prev, trimmed]);
    setInputValue("");
  }

  function remove(value: string) {
    setSelected((prev) => prev.filter((v) => v !== value));
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />

      {selected.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {selected.map((ing) => (
            <span
              key={ing}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-2 pl-3.5 pr-2 text-[13px] font-semibold text-accent-ink"
            >
              {ing}
              <button
                type="button"
                onClick={() => remove(ing)}
                aria-label={`${ing} 삭제`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-accent"
              >
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(inputValue);
            }
          }}
          placeholder="재료 검색 또는 직접 입력 후 Enter"
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
        />
        {focused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
                className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-surface"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

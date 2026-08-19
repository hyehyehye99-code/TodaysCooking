"use client";

import { useState } from "react";

export function TagPicker({
  name,
  existingTags,
  defaultSelected = [],
}: {
  name: string;
  existingTags: string[];
  defaultSelected?: string[];
}) {
  const [options, setOptions] = useState<string[]>(() => [
    ...new Set([...existingTags, ...defaultSelected]),
  ]);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [customInput, setCustomInput] = useState("");

  function toggle(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustom() {
    const value = customInput.trim();
    if (!value) return;
    setOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSelected((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomInput("");
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap items-center gap-2">
        {options.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`inline-flex items-center rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${
                active ? "bg-accent text-white" : "bg-surface text-ink-soft"
              }`}
            >
              #{tag}
            </button>
          );
        })}

        <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-surface py-1 pl-3 pr-1.5">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="태그 추가"
            className="w-16 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
          />
          <button
            type="button"
            onClick={addCustom}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
}

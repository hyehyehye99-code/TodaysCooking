"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/client";

const EMOJI_OPTIONS = [
  "🍳", "🍜", "🍲", "🥘", "🍱", "🍛", "🥗", "🍝",
  "🍕", "🥟", "🍚", "🍖", "🥩", "🍤", "🍙", "🧁", "🍞", "🥞",
];

export function EmojiPicker({
  name,
  defaultValue,
  onChange,
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
}) {
  const dict = useDict();
  const [options, setOptions] = useState<string[]>(() =>
    defaultValue && !EMOJI_OPTIONS.includes(defaultValue)
      ? [...EMOJI_OPTIONS, defaultValue]
      : EMOJI_OPTIONS
  );
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function select(value: string) {
    setSelected(value);
    onChange?.(value);
  }

  function addCustom() {
    const value = customInput.trim();
    if (!value) return;
    setOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));
    select(value);
    setCustomInput("");
    setShowCustom(false);
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="flex flex-wrap gap-2">
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => select(selected === emoji ? "" : emoji)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${
              selected === emoji ? "bg-accent/14 ring-2 ring-accent" : "bg-surface"
            }`}
          >
            {emoji}
          </button>
        ))}

        {showCustom ? (
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
              autoFocus
              placeholder={dict.components.emojiInputPlaceholder}
              className="w-20 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
            />
            <button
              type="button"
              onClick={addCustom}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
            >
              +
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            aria-label={dict.components.more}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg font-bold text-ink-soft"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

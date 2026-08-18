"use client";

import { useState } from "react";

const EMOJI_OPTIONS = [
  "🍳", "🍜", "🍲", "🥘", "🍱", "🍛", "🥗", "🍝",
  "🍕", "🥟", "🍚", "🍖", "🥩", "🍤", "🍙", "🧁", "🍞", "🥞",
];

export function EmojiPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setSelected((prev) => (prev === emoji ? "" : emoji))}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${
              selected === emoji ? "bg-accent/14 ring-2 ring-accent" : "bg-surface"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { FittedMascot, type MascotName } from "@/components/Mascot";
import { parseMascotIcon, toMascotIcon } from "@/lib/mascotIcon";
import { useDict } from "@/lib/i18n/client";

const EMOJI_OPTIONS = [
  "🍳", "🍜", "🍲", "🥘", "🍱", "🍛", "🥗", "🍝",
  "🍕", "🥟", "🍚", "🍖", "🥩", "🍤", "🍙", "🧁", "🍞", "🥞",
];

// The 레시핑 characters, offered alongside the emoji. A pick is stored as
// "mascot:<name>" in the same icon field (see lib/mascotIcon.ts).
const MASCOT_OPTIONS: MascotName[] = [
  "main", "basic", "excited", "happy", "laugh", "tasty", "love", "shy", "surprised", "sparkle",
  "confused", "idea", "rest", "sleep", "cooking", "recipe", "fridge", "shopping",
  "giggle", "heart-eyes", "big-hug", "puzzled", "singing", "loved", "trophy", "confetti-happy",
  "whisking", "chopping", "stirring-pot", "frying-egg", "apron-spatula", "reading-recipe",
  "baking-cookies", "washing-veggies", "shopping-basket", "grocery-bag",
  "curry-plate", "pancake-hold", "pizza-hold", "burger-hold", "bubbletea-hold", "salad-hold",
  "item-pot", "item-spoon", "item-tomato", "item-carrot", "item-greens", "item-meat",
  "item-mushroom", "item-egg", "item-cheese", "item-bag",
  "food-onion", "food-garlic", "food-potato", "food-bellpepper", "food-noodles", "food-bread",
  "food-milk", "food-salmon", "food-shrimp", "food-chicken", "food-cheese2", "food-strawberry",
  "food-lemon", "food-blueberry", "food-toast",
  "tool-whisk", "tool-spatula", "tool-chefhat", "tool-apron", "tool-pan", "tool-knife",
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
    defaultValue && !parseMascotIcon(defaultValue) && !EMOJI_OPTIONS.includes(defaultValue)
      ? [...EMOJI_OPTIONS, defaultValue]
      : EMOJI_OPTIONS
  );
  const [selected, setSelected] = useState(defaultValue ?? "");
  // Opens on whichever tab holds the current pick — and on the characters when
  // nothing is picked yet, since that's the brand's face.
  const [tab, setTab] = useState<"emoji" | "mascot">(() =>
    defaultValue && !parseMascotIcon(defaultValue) ? "emoji" : "mascot"
  );
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

      <div className="mb-3 inline-flex rounded-full bg-surface p-0.5">
        {(
          [
            ["mascot", dict.components.pickerMascotTab],
            ["emoji", dict.components.pickerEmojiTab],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              tab === key ? "bg-white text-ink shadow-sm" : "text-ink-faint"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "mascot" ? (
        <div className="flex flex-wrap gap-2">
          {MASCOT_OPTIONS.map((mascot) => {
            const token = toMascotIcon(mascot);
            return (
              <button
                key={mascot}
                type="button"
                onClick={() => select(selected === token ? "" : token)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  selected === token ? "bg-accent/14 ring-2 ring-accent" : "bg-surface"
                }`}
              >
                <FittedMascot name={mascot} box={48} />
              </button>
            );
          })}
        </div>
      ) : (
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
      )}
    </div>
  );
}

import type { createClient } from "@/lib/supabase/server";

export type IngredientRuleType = "unit_suffix" | "quantity_word" | "count_word" | "phrase";

export type CustomIngredientRules = {
  unitSuffixes: string[];
  quantityWords: string[];
  countWords: string[];
  phrases: string[];
};

export const EMPTY_CUSTOM_RULES: CustomIngredientRules = {
  unitSuffixes: [],
  quantityWords: [],
  countWords: [],
  phrases: [],
};

// Common amount-only words that carry no digit, so the digit check below
// wouldn't catch them on their own — e.g. "고추장 듬뿍" should split into
// name "고추장" + amount "듬뿍", not get stuck as one unsplit blob (which
// then fails to match "고추장" in the fridge/shopping list by exact name).
export const DEFAULT_QUANTITY_WORDS = [
  "약간", "적당량", "적당히", "조금", "조금씩", "약간씩", "약간만",
  "넉넉히", "넉넉하게", "듬뿍", "듬뿍씩", "많이", "충분히",
  "소량", "소량씩", "한꼬집", "한꼬집씩", "한줌", "한줌씩",
  "한스푼", "한큰술", "한작은술", "한컵", "한주먹", "큰것",
];

// Size descriptors like "감자 1개 큰 것" written with a space — the two words
// can never land in the same whitespace-delimited lastToken that quantity
// words/unit suffixes check below, so they're matched as a trailing phrase
// before the normal single-token split runs.
export const DEFAULT_PHRASES = ["큰 것"];

// Unit suffixes that make a trailing token look like an amount even without
// a digit or an exact quantity-word match (e.g. "두어스푼", "몇큰술"). "장" is
// deliberately excluded — 고추장/된장/쌈장/간장 (whole 장류 category) would
// falsely look like an amount as the second word of a compound name.
export const DEFAULT_UNIT_SUFFIXES = [
  "g", "kg", "ml", "l", "cc", "개", "컵", "큰술", "작은술", "스푼", "티스푼",
  "조각", "쪽", "알", "마리", "모", "봉지", "팩", "단", "줌", "주먹", "꼬집",
  "병", "캔", "통", "인분",
];

// A count word immediately before a unit ("두 주먹", "반 스푼", "두 꼬집") —
// written with a space, so like DEFAULT_PHRASES it can't be caught by a
// single trailing token. Checked as a live "count + unit" pair rather than a
// fixed phrase list, since count words freely combine with any unit above.
export const DEFAULT_COUNT_WORDS = [
  "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
  "반", "두어", "몇", "여러",
];

export async function loadCustomIngredientRules(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CustomIngredientRules> {
  const { data } = await supabase.from("ingredient_parse_rules").select("type, value");
  const rows = (data as { type: IngredientRuleType; value: string }[] | null) ?? [];
  return {
    unitSuffixes: rows.filter((r) => r.type === "unit_suffix").map((r) => r.value),
    quantityWords: rows.filter((r) => r.type === "quantity_word").map((r) => r.value),
    countWords: rows.filter((r) => r.type === "count_word").map((r) => r.value),
    phrases: rows.filter((r) => r.type === "phrase").map((r) => r.value),
  };
}

function isCountWord(token: string, countWords: Set<string>) {
  return countWords.has(token) || /^\d+$/.test(token);
}

function looksLikeAmountWord(token: string, quantityWords: Set<string>, unitSuffixes: string[]) {
  return (
    /\d/.test(token) ||
    quantityWords.has(token) ||
    unitSuffixes.some((suffix) => token.toLowerCase().endsWith(suffix))
  );
}

// Splits a manually-typed line like "돼지고기 200g" into name + amount, so
// the name alone can still match fridge/shopping items by exact string (see
// setIngredientState) while the amount isn't lost — it's just kept
// alongside instead of baked into the name. Only the trailing whitespace-
// delimited token (or, for a count-word pair like "두 주먹", the trailing
// two tokens) is treated as a candidate amount; if neither looks like one,
// the whole line stays the name unchanged — the common single-word-
// ingredient case is never touched.
export function splitIngredientLine(
  raw: string,
  custom: CustomIngredientRules = EMPTY_CUSTOM_RULES
): { name: string; amount: string | null } {
  const trimmed = raw.trim();
  const phrases = [...DEFAULT_PHRASES, ...custom.phrases];
  const quantityWords = new Set([...DEFAULT_QUANTITY_WORDS, ...custom.quantityWords]);
  const unitSuffixes = [...DEFAULT_UNIT_SUFFIXES, ...custom.unitSuffixes];
  const countWords = new Set([...DEFAULT_COUNT_WORDS, ...custom.countWords]);

  for (const phrase of phrases) {
    const suffix = ` ${phrase}`;
    if (trimmed.length > suffix.length && trimmed.endsWith(suffix)) {
      return { name: trimmed.slice(0, -suffix.length).trim(), amount: phrase };
    }
  }

  const twoTokenMatch = trimmed.match(/^(.+?)\s+(\S+)\s+(\S+)$/);
  if (twoTokenMatch) {
    const [, namePart, countWord, unitWord] = twoTokenMatch;
    if (isCountWord(countWord, countWords) && looksLikeAmountWord(unitWord, quantityWords, unitSuffixes)) {
      return { name: namePart.trim(), amount: `${countWord} ${unitWord}` };
    }
  }

  const match = trimmed.match(/^(.+?)\s+(\S+)$/);
  if (!match) return { name: trimmed, amount: null };
  const [, namePart, lastToken] = match;
  if (!looksLikeAmountWord(lastToken, quantityWords, unitSuffixes)) return { name: trimmed, amount: null };
  return { name: namePart.trim(), amount: lastToken };
}

export function parseIngredients(raw: string, custom: CustomIngredientRules = EMPTY_CUSTOM_RULES) {
  return raw
    .split(/[\n,]|또는/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => splitIngredientLine(line, custom))
    .filter((i) => i.name.length > 0);
}

import { isMascotName, type MascotName } from "@/components/Mascot";

// Profile / recipe / meal-plan / timer icons are stored in the existing
// `icon_emoji` text columns. A mascot pick is saved as "mascot:<name>" — no
// schema change, and anything that isn't a known mascot name is still treated
// as a plain emoji.
const PREFIX = "mascot:";

export function toMascotIcon(name: MascotName) {
  return `${PREFIX}${name}`;
}

export function parseMascotIcon(value: string | null | undefined): MascotName | null {
  if (!value || !value.startsWith(PREFIX)) return null;
  const name = value.slice(PREFIX.length);
  return isMascotName(name) ? name : null;
}

// Places that only understand text (the iOS timer Live Activity) get a close
// emoji stand-in instead of the raw "mascot:..." token.
const NATIVE_EMOJI: Record<MascotName, string> = {
  main: "🍳", basic: "🍳", excited: "🤩", happy: "😊", tasty: "😋", surprised: "😲", laugh: "😆",
  cooking: "🍳", recipe: "📖", fridge: "🧊", shopping: "🛒", rest: "☕", idea: "💡", love: "❤️",
  shy: "😳", sparkle: "✨", confused: "❓", sleep: "😴", logo: "🍳", "logo-soft": "🍳", "logo-face": "🍳",
  "item-spoon": "🥄", "item-pot": "🍲", "item-tomato": "🍅", "item-carrot": "🥕", "item-greens": "🥬",
  "item-meat": "🥩", "item-mushroom": "🍄", "item-egg": "🥚", "item-cheese": "🧀", "item-bag": "🛍️",
};

export function toPlainEmoji(value: string | null | undefined): string {
  if (!value) return "";
  const name = parseMascotIcon(value);
  return name ? NATIVE_EMOJI[name] : value;
}

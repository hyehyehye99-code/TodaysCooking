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

  giggle: "😆", "heart-eyes": "😍", "big-hug": "🤗", startled: "😲", crying: "😢", "star-hold": "🌟",
  sleeping: "😴", puzzled: "❓", annoyed: "😤", singing: "🎵", "holding-produce": "🥦", tasting: "😋",
  "utensils-pose": "🍽️", loved: "🥰", whisking: "🥣", chopping: "🔪", "stirring-pot": "🍲",
  "frying-egg": "🍳", "apron-spatula": "🍳", "reading-recipe": "📖", "baking-cookies": "🍪",
  "fridge-open": "🧊", "plated-dish": "🍽️", "washing-veggies": "🥬", "shopping-basket": "🧺",
  "grocery-bag": "🛍️", "holding-bread": "🥖", "salad-hold": "🥗", "curry-plate": "🍛",
  "pancake-hold": "🥞", "pizza-hold": "🍕", "burger-hold": "🍔", "bubbletea-hold": "🧋",
  "confetti-happy": "🎉", trophy: "🏆",
  "tool-whisk": "🥣", "tool-spatula": "🍳", "tool-ladle": "🥄", "tool-chefhat": "👨‍🍳",
  "tool-apron": "🍳", "tool-pan": "🍳", "tool-cuttingboard": "🔪", "tool-knife": "🔪",
  "tool-rollingpin": "🥖", "tool-ovenmitt": "🧤", "tool-timer": "⏱️", "tool-recipebook": "📖",
  "tool-measuringcup": "🥤",
  "food-tomato": "🍅", "food-carrot": "🥕", "food-onion": "🧅", "food-garlic": "🧄",
  "food-potato": "🥔", "food-bellpepper": "🫑", "food-noodles": "🍜", "food-bread": "🍞",
  "food-milk": "🥛", "food-soup": "🍲", "food-pizza": "🍕", "food-smoothie": "🥤",
  "food-salmon": "🐟", "food-shrimp": "🍤", "food-chicken": "🍗", "food-egg2": "🥚",
  "food-cheese2": "🧀", "food-mushroom2": "🍄", "food-strawberry": "🍓", "food-lemon": "🍋",
  "food-blueberry": "🫐", "food-spinach": "🥬", "food-butter": "🧈", "food-salt": "🧂",
  "food-pepper": "🧂", "food-toast": "🍞",
  "badge-redheart": "❤️", "badge-greenheart": "💚", "badge-star": "⭐", "badge-flower": "🌸",
  "badge-heart": "❤️", "badge-check": "✅", "badge-bookmark": "🔖", "badge-chefhat": "👨‍🍳",
};

export function toPlainEmoji(value: string | null | undefined): string {
  if (!value) return "";
  const name = parseMascotIcon(value);
  return name ? NATIVE_EMOJI[name] : value;
}

// 레시핑 mascot sprites (public/mascot/*.png, cut from the brand sheet).
// Intrinsic sizes are listed so the <img> reserves its box before the image
// loads — no layout shift on skeletons and empty states.
const SPRITES = {
  main: [381, 323], // hero: winking with the wooden spoon
  basic: [192, 156],
  excited: [176, 139],
  happy: [169, 164],
  tasty: [159, 155],
  surprised: [165, 186],
  laugh: [189, 139],
  cooking: [184, 189],
  recipe: [156, 162],
  fridge: [186, 184],
  shopping: [176, 167],
  rest: [156, 157],
  idea: [188, 199],
  love: [147, 116],
  shy: [118, 104],
  sparkle: [150, 116],
  confused: [115, 139],
  sleep: [146, 90],
  logo: [143, 140], // app icon (orange tile)
  "logo-soft": [136, 140],
  "logo-face": [143, 144],
  "item-spoon": [69, 87],
  "item-pot": [101, 78],
  "item-tomato": [69, 73],
  "item-carrot": [69, 88],
  "item-greens": [75, 88],
  "item-meat": [77, 73],
  "item-mushroom": [70, 73],
  "item-egg": [68, 79],
  "item-cheese": [71, 73],
  "item-bag": [74, 111],

  // Second sheet: more expressions/poses, cooking tools, ingredients, and
  // plain (no baked-in text) badge icons. Re-exported as individually
  // cropped PNGs (each on its own transparent canvas) rather than cut from
  // one sprite sheet — fixes the "neighboring icon bleeds in" bug that the
  // sheet-cropping approach had.
  giggle: [314, 320],
  "heart-eyes": [320, 277],
  "big-hug": [294, 320],
  startled: [298, 320],
  crying: [318, 320],
  "star-hold": [320, 309],
  sleeping: [320, 274],
  puzzled: [309, 320],
  annoyed: [320, 305],
  singing: [320, 294],
  "holding-produce": [171, 135],
  tasting: [320, 312],
  "utensils-pose": [282, 320],
  loved: [268, 320],
  whisking: [237, 320],
  chopping: [267, 320],
  "stirring-pot": [259, 320],
  "frying-egg": [320, 304],
  "apron-spatula": [277, 320],
  "reading-recipe": [260, 320],
  "baking-cookies": [275, 320],
  "fridge-open": [288, 320],
  "plated-dish": [281, 320],
  "washing-veggies": [296, 320],
  "shopping-basket": [298, 320],
  "grocery-bag": [302, 320],
  "holding-bread": [263, 320],
  "salad-hold": [310, 320],
  "curry-plate": [298, 320],
  "pancake-hold": [306, 320],
  "pizza-hold": [313, 320],
  "burger-hold": [267, 320],
  "bubbletea-hold": [306, 320],
  "confetti-happy": [264, 320],
  trophy: [320, 248],
  "tool-whisk": [193, 320],
  "tool-spatula": [230, 320],
  "tool-ladle": [222, 320],
  "tool-chefhat": [287, 320],
  "tool-apron": [282, 320],
  "tool-pan": [320, 311],
  "tool-cuttingboard": [240, 320],
  "tool-knife": [237, 320],
  "tool-rollingpin": [305, 320],
  "tool-ovenmitt": [291, 320],
  "tool-timer": [320, 277],
  "tool-recipebook": [288, 320],
  "tool-measuringcup": [303, 320],
  "food-tomato": [320, 320],
  "food-carrot": [262, 320],
  "food-onion": [285, 320],
  "food-garlic": [298, 320],
  "food-potato": [306, 320],
  "food-bellpepper": [282, 320],
  "food-noodles": [320, 283],
  "food-bread": [320, 307],
  "food-milk": [271, 320],
  "food-soup": [320, 262],
  "food-pizza": [320, 257],
  "food-smoothie": [303, 320],
  "food-salmon": [320, 291],
  "food-shrimp": [286, 320],
  "food-chicken": [303, 320],
  "food-egg2": [281, 320],
  "food-cheese2": [320, 288],
  "food-mushroom2": [320, 281],
  "food-strawberry": [260, 320],
  "food-lemon": [270, 320],
  "food-blueberry": [320, 295],
  "food-spinach": [294, 320],
  "food-butter": [320, 259],
  "food-salt": [210, 320],
  "food-pepper": [236, 320],
  "food-toast": [320, 254],
  "badge-redheart": [320, 292],
  "badge-greenheart": [320, 286],
  "badge-star": [287, 320],
  "badge-flower": [320, 306],
  "badge-heart": [320, 260],
  "badge-check": [320, 320],
  "badge-bookmark": [280, 320],
  "badge-chefhat": [320, 295],

  // Same individually-exported batch as the second sheet above, but these
  // didn't have a matching old sprite to replace — kept as brand-new poses/
  // items instead of being dropped.
  "tongue-out": [269, 320],
  "thumbs-up": [320, 288],
  peeking: [274, 320],
  content: [320, 308],
  cheerful: [320, 312],
  floating: [306, 320],
  cheering: [320, 245],
  "chef-greeting": [279, 320],
  "tool-ricescoop": [172, 320],
  "tool-pot": [320, 266],
  "tool-fridge": [242, 320],
  "food-cucumber": [274, 320],
  "food-broccoli": [295, 320],
  "food-bellpepper-yellow": [278, 320],
  "food-chilipepper": [169, 320],
  "food-corn": [233, 320],
  "food-ricebowl": [320, 302],
  "food-peabowl": [320, 254],
  "food-spaghetti": [320, 233],
  "food-omurice": [320, 228],
  "food-curryrice": [320, 243],
  "food-lemonhalf": [251, 320],
  "food-pancake": [320, 216],
  "food-cupcake": [316, 320],
  "badge-sparkle": [320, 310],
  "badge-corn": [320, 249],
  "badge-musicnote": [320, 299],
  "badge-bubble": [320, 311],

  // Splash-screen artwork crop: selfie + shopping checklist + full basket.
  "checklist-selfie": [979, 972],
} as const;

export type MascotName = keyof typeof SPRITES;
export const MASCOT_NAMES = Object.keys(SPRITES) as MascotName[];

export function isMascotName(value: string): value is MascotName {
  return Object.prototype.hasOwnProperty.call(SPRITES, value);
}

// `size` is the rendered width in px; height follows the sprite's aspect
// ratio. Decorative by default (alt="") — pass `alt` only when the mascot
// itself carries meaning.
export function Mascot({
  name,
  size = 96,
  alt = "",
  className = "",
}: {
  name: MascotName;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const [w, h] = SPRITES[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/mascot/${name}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={Math.round((size * h) / w)}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}

// Where a slot has nothing of its own to show (no profile emoji, no recipe
// photo, no meal-plan icon...), it gets one of these instead. Picked from the
// seed, so the same person/recipe always gets the same character while a list
// of them shows a lively mix.
const POOLS = {
  avatar: [
    "basic", "excited", "happy", "tasty", "laugh", "love", "shy", "sparkle", "surprised", "rest", "idea",
    "confused", "giggle", "heart-eyes", "big-hug", "star-hold", "puzzled", "singing", "loved", "tasting",
    "tongue-out", "thumbs-up", "peeking", "content", "cheerful", "floating", "cheering",
  ],
  recipe: [
    "cooking", "recipe", "tasty", "idea", "love", "sparkle", "excited", "happy",
    "laugh", "shopping", "fridge", "rest", "basic", "surprised",
    "item-pot", "item-tomato", "item-carrot", "item-egg",
    "whisking", "chopping", "stirring-pot", "frying-egg", "apron-spatula", "baking-cookies",
    "plated-dish", "curry-plate", "pancake-hold", "pizza-hold", "burger-hold", "bubbletea-hold",
    "salad-hold", "holding-bread", "holding-produce", "chef-greeting",
    "food-omurice", "food-spaghetti", "food-curryrice", "food-pancake", "food-cupcake",
  ],
  mealPlan: [
    "recipe", "idea", "happy", "shopping", "fridge", "love", "sparkle", "rest", "tasty", "cooking",
    "item-bag", "item-pot", "reading-recipe", "trophy", "confetti-happy", "grocery-bag", "shopping-basket",
    "food-ricebowl", "food-curryrice", "food-omurice",
  ],
  timer: [
    "cooking", "item-pot", "item-egg", "rest", "idea", "item-spoon", "excited", "item-tomato",
    "stirring-pot", "frying-egg", "whisking", "tool-timer", "tool-pot",
  ],
} as const satisfies Record<string, readonly MascotName[]>;

export type MascotPool = keyof typeof POOLS;

// FNV-1a plus a final avalanche: seeds that differ by a character or two (ids
// or titles created together) still land on different mascots.
function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

export function pickMascot(pool: MascotPool, seed: string): MascotName {
  const list = POOLS[pool];
  return list[hashSeed(seed) % list.length];
}

// A mascot fitted inside a square `box` (px), wide or tall sprites included,
// so it drops into any avatar/thumbnail slot without distorting.
export function FittedMascot({ name, box, className = "" }: { name: MascotName; box: number; className?: string }) {
  const [w, h] = SPRITES[name];
  const fit = box * 0.86;
  const width = w >= h ? fit : fit * (w / h);
  return <Mascot name={name} size={Math.max(8, Math.round(width))} className={className} />;
}

// A pooled mascot for a slot that has nothing of its own to show.
export function DefaultMascot({
  pool,
  seed,
  box,
  className = "",
}: {
  pool: MascotPool;
  seed: string;
  box: number;
  className?: string;
}) {
  return <FittedMascot name={pickMascot(pool, seed)} box={box} className={className} />;
}

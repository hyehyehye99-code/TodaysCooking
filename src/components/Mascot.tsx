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
  // plain (no baked-in text) badge icons.
  giggle: [167, 176],
  "heart-eyes": [157, 140],
  "big-hug": [139, 153],
  startled: [145, 151],
  crying: [141, 135],
  "star-hold": [139, 145],
  sleeping: [192, 148],
  puzzled: [146, 144],
  annoyed: [142, 140],
  singing: [157, 144],
  "holding-produce": [171, 135],
  tasting: [130, 130],
  "utensils-pose": [126, 124],
  loved: [121, 127],
  whisking: [127, 170],
  chopping: [142, 168],
  "stirring-pot": [130, 162],
  "frying-egg": [162, 151],
  "apron-spatula": [148, 169],
  "reading-recipe": [130, 157],
  "baking-cookies": [136, 165],
  "fridge-open": [140, 165],
  "plated-dish": [132, 150],
  "washing-veggies": [141, 152],
  "shopping-basket": [137, 148],
  "grocery-bag": [138, 137],
  "holding-bread": [124, 147],
  "salad-hold": [130, 135],
  "curry-plate": [122, 128],
  "pancake-hold": [129, 136],
  "pizza-hold": [138, 142],
  "burger-hold": [128, 142],
  "bubbletea-hold": [132, 142],
  "confetti-happy": [194, 145],
  trophy: [128, 143],
  "tool-whisk": [88, 123],
  "tool-spatula": [97, 118],
  "tool-ladle": [90, 110],
  "tool-chefhat": [110, 98],
  "tool-apron": [104, 113],
  "tool-pan": [123, 110],
  "tool-cuttingboard": [87, 106],
  "tool-knife": [83, 104],
  "tool-rollingpin": [119, 111],
  "tool-ovenmitt": [79, 93],
  "tool-timer": [90, 81],
  "tool-recipebook": [95, 102],
  "tool-measuringcup": [94, 79],
  "food-tomato": [76, 77],
  "food-carrot": [71, 89],
  "food-onion": [72, 80],
  "food-garlic": [72, 78],
  "food-potato": [71, 73],
  "food-bellpepper": [71, 84],
  "food-noodles": [81, 72],
  "food-bread": [80, 80],
  "food-milk": [68, 91],
  "food-soup": [97, 76],
  "food-pizza": [98, 95],
  "food-smoothie": [73, 92],
  "food-salmon": [83, 68],
  "food-shrimp": [69, 78],
  "food-chicken": [78, 80],
  "food-egg2": [61, 70],
  "food-cheese2": [72, 69],
  "food-mushroom2": [77, 70],
  "food-strawberry": [58, 67],
  "food-lemon": [119, 69],
  "food-blueberry": [81, 71],
  "food-spinach": [73, 79],
  "food-butter": [89, 70],
  "food-salt": [53, 72],
  "food-pepper": [51, 72],
  "food-toast": [99, 89],
  "badge-redheart": [62, 56],
  "badge-greenheart": [64, 57],
  "badge-star": [68, 65],
  "badge-flower": [73, 71],
  "badge-heart": [88, 74],
  "badge-check": [72, 70],
  "badge-bookmark": [60, 70],
  "badge-chefhat": [83, 71],
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
  ],
  recipe: [
    "cooking", "recipe", "tasty", "idea", "love", "sparkle", "excited", "happy",
    "laugh", "shopping", "fridge", "rest", "basic", "surprised",
    "item-pot", "item-tomato", "item-carrot", "item-egg",
    "whisking", "chopping", "stirring-pot", "frying-egg", "apron-spatula", "baking-cookies",
    "plated-dish", "curry-plate", "pancake-hold", "pizza-hold", "burger-hold", "bubbletea-hold",
    "salad-hold", "holding-bread", "holding-produce",
  ],
  mealPlan: [
    "recipe", "idea", "happy", "shopping", "fridge", "love", "sparkle", "rest", "tasty", "cooking",
    "item-bag", "item-pot", "reading-recipe", "trophy", "confetti-happy", "grocery-bag", "shopping-basket",
  ],
  timer: [
    "cooking", "item-pot", "item-egg", "rest", "idea", "item-spoon", "excited", "item-tomato",
    "stirring-pot", "frying-egg", "whisking", "tool-timer",
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

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
} as const;

export type MascotName = keyof typeof SPRITES;

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
  avatar: ["basic", "excited", "happy", "tasty", "laugh", "love", "shy", "sparkle", "surprised", "rest", "idea", "confused"],
  recipe: [
    "cooking", "recipe", "tasty", "idea", "love", "sparkle", "excited", "happy",
    "laugh", "shopping", "fridge", "rest", "basic", "surprised",
    "item-pot", "item-tomato", "item-carrot", "item-egg",
  ],
  mealPlan: ["recipe", "idea", "happy", "shopping", "fridge", "love", "sparkle", "rest", "tasty", "cooking", "item-bag", "item-pot"],
  timer: ["cooking", "item-pot", "item-egg", "rest", "idea", "item-spoon", "excited", "item-tomato"],
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

// A pooled mascot fitted inside a square `box` (px), wide or tall sprites
// included, so it drops into any avatar/thumbnail slot without distorting.
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
  const name = pickMascot(pool, seed);
  const [w, h] = SPRITES[name];
  const fit = box * 0.86;
  const width = w >= h ? fit : fit * (w / h);
  return <Mascot name={name} size={Math.max(8, Math.round(width))} className={className} />;
}

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

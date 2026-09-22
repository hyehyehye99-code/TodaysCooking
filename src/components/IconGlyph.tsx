import { FittedMascot } from "@/components/Mascot";
import { parseMascotIcon } from "@/lib/mascotIcon";

// Renders a stored icon value: a "mascot:<name>" token as the character,
// anything else as the emoji text. Callers keep their own sized, centred
// container (the emoji's font size lives there); `box` is that container's side.
export function IconGlyph({ value, box }: { value: string; box: number }) {
  const name = parseMascotIcon(value);
  if (!name) return <>{value}</>;
  return <FittedMascot name={name} box={box} />;
}

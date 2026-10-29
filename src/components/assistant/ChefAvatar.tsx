import { Mascot, type MascotName } from "@/components/Mascot";

export function ChefAvatar({ size = 32, mascot = "chef-greeting" }: { size?: number; mascot?: MascotName }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 ring-1 ring-accent/15"
    >
      <Mascot name={mascot} size={Math.round(size * 0.82)} />
    </span>
  );
}

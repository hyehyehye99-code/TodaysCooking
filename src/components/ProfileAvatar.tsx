import { DefaultMascot, type MascotPool } from "@/components/Mascot";

// `kind` picks which mascots fill the slot when there's no emoji: "avatar" for
// people, "mealPlan" for meal-plan icons.
export function ProfileAvatar({
  iconEmoji,
  nickname,
  size = 40,
  className = "",
  kind = "avatar",
}: {
  iconEmoji?: string | null;
  nickname: string;
  size?: number;
  className?: string;
  kind?: MascotPool;
}) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface font-bold text-ink-soft ${className}`}
    >
      {iconEmoji || <DefaultMascot pool={kind} seed={nickname.trim() || "?"} box={size} />}
    </div>
  );
}

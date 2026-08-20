export function ProfileAvatar({
  iconEmoji,
  nickname,
  size = 40,
  className = "",
}: {
  iconEmoji?: string | null;
  nickname: string;
  size?: number;
  className?: string;
}) {
  const initial = nickname.trim().charAt(0) || "?";

  return (
    <div
      style={{ width: size, height: size, fontSize: size * (iconEmoji ? 0.55 : 0.4) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent/12 font-bold text-accent-ink ${className}`}
    >
      {iconEmoji || initial}
    </div>
  );
}

import { Mascot, type MascotName } from "@/components/Mascot";

export function EmptyState({ mascot, children }: { mascot: MascotName; children: React.ReactNode }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 text-center">
      <Mascot name={mascot} size={112} />
      <p className="whitespace-pre-line text-sm text-ink-soft">{children}</p>
    </div>
  );
}

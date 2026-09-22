import { Mascot } from "@/components/Mascot";

// Shown while the AI recipe extraction (generateRecipeFromLink) is running —
// gives the wait somewhere to look instead of just a disabled button.
export function AiWritingIndicator({ label }: { label: string }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2.5 rounded-xl border border-accent/20 bg-accent/6 py-3">
      <Mascot name="idea" size={36} className="animate-bob" />
      <span className="text-xs font-bold text-accent-ink">{label}</span>
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-accent"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}

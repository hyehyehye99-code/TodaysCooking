"use client";

import { LINK_STEPS } from "@/lib/assistant/types";

// Shown while the assistant is working. A link gets the three real pipeline
// steps (driven by the server's step events); plain chat just gets a thinking line.
export function LiveProgress({ isLink, step }: { isLink: boolean; step: number }) {
  const label = isLink ? LINK_STEPS[Math.min(step, 3) - 1] : "🧑‍🍳 셰프가 생각하고 있어요...";
  return (
    <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
      {/* key re-mounts the line on each step so the fade-in replays */}
      <p key={label} className="animate-pulse text-sm font-medium text-stone-700 [animation-duration:1.6s]">
        {label}
      </p>
      {isLink && (
        <div className="mt-2.5 flex gap-1.5" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${n <= step ? "bg-accent" : "bg-stone-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

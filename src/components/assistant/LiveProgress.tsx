"use client";

import { LINK_STEPS } from "@/lib/assistant/types";
import { Mascot, type MascotName } from "@/components/Mascot";

// Shown while the assistant is working. A link gets the three real pipeline
// steps (driven by the server's step events); plain chat just gets a thinking line.
const STEP_MASCOTS: MascotName[] = ["reading-recipe", "chopping", "stirring-pot"];

export function LiveProgress({ isLink, step }: { isLink: boolean; step: number }) {
  const mascot: MascotName = isLink ? STEP_MASCOTS[Math.min(step, 3) - 1] : "idea";
  const label = isLink ? LINK_STEPS[Math.min(step, 3) - 1] : "🧑‍🍳 셰프가 생각하고 있어요...";
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/15">
        {/* key re-mounts per step so each new mascot pops in */}
        <Mascot
          key={mascot}
          name={mascot}
          size={46}
          className="animate-bounce [animation-duration:1.4s]"
        />
      </span>
      <div className="min-w-0 max-w-[85%] rounded-3xl rounded-tl-md border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
        {/* key re-mounts the line on each step so the fade-in replays */}
        <p key={label} className="animate-pulse text-sm font-medium text-stone-700 [animation-duration:1.6s]">
          {label}
        </p>
        {isLink && (
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${n <= step ? "bg-accent" : "bg-stone-200"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Mascot } from "@/components/Mascot";

// A brief self-dismissing confirmation for the viewer's own save action —
// distinct from ActivityToaster, which only surfaces other members' activity
// and explicitly skips the actor's own. `trigger` is a number the caller
// increments on every successful save; remounting the inner element (via
// `key`) restarts the CSS fade-in/hold/fade-out animation (see .animate-
// toast in globals.css), and its end fires onAnimationEnd — no timers or
// effect-driven setState needed to dismiss it.
export function SavedToast({ message, trigger }: { message: string; trigger: number }) {
  const [dismissedTrigger, setDismissedTrigger] = useState(0);

  if (trigger === 0 || trigger === dismissedTrigger) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ top: "max(env(safe-area-inset-top), 16px)" }}
    >
      <div
        key={trigger}
        onAnimationEnd={() => setDismissedTrigger(trigger)}
        className="animate-toast flex items-center gap-2 rounded-full bg-ink py-1.5 pl-2.5 pr-4 text-xs font-bold text-white shadow-lg"
      >
        <Mascot name="happy" size={26} />
        {message}
      </div>
    </div>
  );
}

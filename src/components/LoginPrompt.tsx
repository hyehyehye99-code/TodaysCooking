"use client";

import Link from "next/link";
import { Mascot, type MascotName } from "@/components/Mascot";
import { useDict } from "@/lib/i18n/client";

const KINDS = {
  timer: { mascot: "cooking", descKey: "timerDesc" },
  mealPlan: { mascot: "idea", descKey: "mealPlanDesc" },
  account: { mascot: "rest", descKey: "accountDesc" },
} as const satisfies Record<string, { mascot: MascotName; descKey: "timerDesc" | "mealPlanDesc" | "accountDesc" }>;

// Shown in place of a page that needs an account (timers, meal plans, account
// settings) when the visitor is a guest.
export function LoginPrompt({ kind }: { kind: keyof typeof KINDS }) {
  const dict = useDict();
  const { mascot, descKey } = KINDS[kind];

  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <Mascot name={mascot} size={128} />
      <p className="mt-5 text-base font-bold text-ink">{dict.guest.loginRequiredTitle}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{dict.guest[descKey]}</p>
      <p className="mt-1 text-xs text-ink-faint">{dict.guest.syncNote}</p>
      <Link href="/login" className="mt-6 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-white">
        {dict.guest.loginButton}
      </Link>
    </div>
  );
}

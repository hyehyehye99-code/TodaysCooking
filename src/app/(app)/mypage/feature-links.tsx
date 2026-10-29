import Link from "next/link";
import { Mascot, type MascotName } from "@/components/Mascot";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

// 메뉴판 and 타이머 used to be tabs of their own; they're reached from here now.
const LINKS: { href: string; labelKey: "explore" | "timer"; mascot: MascotName }[] = [
  { href: "/explore", labelKey: "explore", mascot: "tool-recipebook" },
  { href: "/timer", labelKey: "timer", mascot: "tool-timer" },
];

export function FeatureLinks({ dict }: { dict: Dictionary }) {
  return (
    <div className="mb-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
            <Mascot name={l.mascot} size={26} />
          </span>
          <span className="flex-1 text-sm font-bold text-ink">{dict.tabBar[l.labelKey]}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

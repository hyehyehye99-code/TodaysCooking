"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useDict } from "@/lib/i18n/client";

export function BackButton({
  href,
  onClick,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const dict = useDict();
  const icon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
  const classes = `flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-ink shadow-[0_2px_10px_rgba(25,31,40,0.08)] ${className}`;

  if (href) {
    return (
      <Link href={href} aria-label={dict.components.back} className={classes}>
        {icon}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={dict.components.back} className={classes}>
      {icon}
    </button>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rounded-[28px] ${className}`}>{children}</div>;
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  if (!right) {
    return <h1 className="mb-5 text-[28px] font-bold tracking-tight">{title}</h1>;
  }
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
      {right}
    </div>
  );
}

export function ProgressBar({ percent, colorClass = "bg-positive" }: { percent: number; colorClass?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

// Detail-page header: round back button on the left, title centered.
export function SubPageHeader({ href, title, right }: { href: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-5 grid grid-cols-[44px_1fr_44px] items-center gap-2">
      <BackButton href={href} />
      <h1 className="truncate text-center text-[17px] font-bold">{title}</h1>
      <div className="flex justify-end">{right}</div>
    </div>
  );
}

// Small grey label above a group of cards.
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 px-2 text-[13px] font-semibold text-ink-soft">{children}</p>;
}

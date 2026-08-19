import type { ReactNode } from "react";
import Link from "next/link";

export function BackButton({
  href,
  onClick,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const icon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
  const classes = `flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink ${className}`;

  if (href) {
    return (
      <Link href={href} aria-label="뒤로" className={classes}>
        {icon}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label="뒤로" className={classes}>
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
  return <div className={`rounded-2xl border border-border ${className}`}>{children}</div>;
}

export function PageHeader({ title }: { title: string }) {
  return <h1 className="mb-4 text-[22px] font-bold tracking-tight">{title}</h1>;
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

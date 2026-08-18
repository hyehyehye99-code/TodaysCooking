import type { ReactNode } from "react";

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

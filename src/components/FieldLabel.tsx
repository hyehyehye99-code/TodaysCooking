"use client";

import { useDict } from "@/lib/i18n/client";

export function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  const dict = useDict();
  return (
    <p className="mb-3 text-[13px] font-bold">
      {children}
      {required && <span className="ml-1.5 text-[11px] font-semibold text-accent">{dict.components.required}</span>}
    </p>
  );
}

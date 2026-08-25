"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import { useDict, useLocale } from "@/lib/i18n/client";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";

export function LanguageSelect() {
  const dict = useDict();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <span className="text-sm font-semibold text-ink">{dict.mypage.language}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => startTransition(() => setLocale(e.target.value))}
        className="rounded-lg bg-surface px-3 py-2 text-xs font-bold text-ink-soft disabled:opacity-60"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

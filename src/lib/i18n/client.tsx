"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./locales";
import type { Dictionary } from "./dictionaries/ko";

const LocaleContext = createContext<{ locale: Locale; dict: Dictionary } | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useDict/useLocale must be used within LocaleProvider");
  return ctx;
}

export function useDict(): Dictionary {
  return useLocaleContext().dict;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

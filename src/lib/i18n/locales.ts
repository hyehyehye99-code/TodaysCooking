export const LOCALES = ["ko", "en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "locale";

// The en/ja translation rollout only covers part of the app so far — showing
// it now would mix translated and still-Korean-only screens for anyone whose
// device isn't Korean. Force Korean everywhere until the full app is
// translated and this is deliberately flipped back on.
export const LOCALE_ROLLOUT_ENABLED = false;

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};

// Parses an Accept-Language header ("ko-KR,ko;q=0.9,en-US;q=0.8") into the
// closest supported locale. Used once, at first visit (see proxy.ts) — after
// that the locale cookie is the source of truth, so a user who picks a
// language manually never gets overridden by their device settings again.
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header.split(",").map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of tags) {
    const base = tag.split("-")[0];
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return DEFAULT_LOCALE;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

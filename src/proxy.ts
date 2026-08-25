import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { LOCALE_COOKIE, LOCALE_ROLLOUT_ENABLED, localeFromAcceptLanguage } from "@/lib/i18n/locales";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Only ever set from the device's own language on a visitor's first
  // request — once they (or a manual pick in mypage) have a locale cookie,
  // that's the source of truth and this never overrides it again.
  // Disabled while the translation rollout is incomplete (see locales.ts) —
  // getLocale() ignores this cookie either way, but there's no reason to
  // write one nobody will read yet.
  if (LOCALE_ROLLOUT_ENABLED && !request.cookies.get(LOCALE_COOKIE)) {
    const locale = localeFromAcceptLanguage(request.headers.get("accept-language"));
    response.cookies.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};

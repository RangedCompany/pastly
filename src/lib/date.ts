import type { Locale } from "./i18n/locale";

export function formatDate(date: string, full = false, locale: Locale = "fr") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(date));
}

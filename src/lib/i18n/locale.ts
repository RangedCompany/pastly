export const LOCALES = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "nl",
  "ja",
] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "pastly-locale";
export const LANGUAGE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  ja: "日本語",
};
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

// A saved choice wins; otherwise respect browser preferences and their quality weights.
export function resolveLocale(saved?: string, acceptLanguage = ""): Locale {
  if (isLocale(saved)) return saved;
  const preferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((value) => value.trim().startsWith("q="));
      const weight = quality ? Number(quality.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase().split("-")[0], weight, index };
    })
    .filter(
      ({ weight }) => Number.isFinite(weight) && weight > 0 && weight <= 1,
    )
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return (preferences.find(({ tag }) => isLocale(tag))?.tag as Locale) ?? "en";
}

export type Messages = Record<string, string>;
export type Translator = ((
  source: string,
  values?: Record<string, string | number>,
) => string) & {
  locale: Locale;
  plural: (one: string, other: string, count: number) => string;
};
export function createTranslator(
  locale: Locale,
  messages: Messages,
): Translator {
  const translate = (
    source: string,
    values?: Record<string, string | number>,
  ) => {
    const translated = Object.hasOwn(messages, source)
      ? messages[source]
      : source;
    return values
      ? translated.replace(/\{(\w+)\}/g, (token, key: string) =>
          Object.prototype.hasOwnProperty.call(values, key)
            ? String(values[key])
            : token,
        )
      : translated;
  };
  return Object.assign(translate, {
    locale,
    plural: (one: string, other: string, count: number) =>
      translate(
        new Intl.PluralRules(locale).select(count) === "one" ? one : other,
        { count: count.toLocaleString(locale) },
      ),
  });
}

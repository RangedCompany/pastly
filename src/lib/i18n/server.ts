import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createTranslator, LOCALE_COOKIE, resolveLocale } from "./locale";

const catalogs = {
  fr: () => import("./messages/fr.json"),
  en: () => import("./messages/en.json"),
  es: () => import("./messages/es.json"),
  de: () => import("./messages/de.json"),
  it: () => import("./messages/it.json"),
  pt: () => import("./messages/pt.json"),
  nl: () => import("./messages/nl.json"),
  ja: () => import("./messages/ja.json"),
};
export const getI18n = cache(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language") ?? "",
  );
  const messages = (await catalogs[locale]()).default;
  return { locale, messages, t: createTranslator(locale, messages) };
});
export async function getTranslations() {
  return (await getI18n()).t;
}

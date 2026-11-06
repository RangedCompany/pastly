"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createTranslator,
  type Locale,
  type Messages,
} from "@/lib/i18n/locale";

const TranslationContext = createContext(createTranslator("fr", {}));
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const t = useMemo(
    () => createTranslator(locale, messages),
    [locale, messages],
  );
  return (
    <TranslationContext.Provider value={t}>
      {children}
    </TranslationContext.Provider>
  );
}
export function useTranslations() {
  return useContext(TranslationContext);
}
export function TranslatedText({ text }: { text: string }) {
  const t = useTranslations();
  return <>{t(text)}</>;
}

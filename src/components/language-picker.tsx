"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useTranslations } from "./i18n";
import {
  LANGUAGE_NAMES,
  LOCALES,
  isLocale,
  LOCALE_COOKIE,
} from "@/lib/i18n/locale";

export function LanguagePicker() {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="language-picker">
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t("Langue")}</span>
      <select
        value={t.locale}
        disabled={pending}
        onChange={(event) => {
          const locale = event.target.value;
          if (!isLocale(locale)) return;
          document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          startTransition(() => router.refresh());
        }}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {LANGUAGE_NAMES[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

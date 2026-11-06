"use client";
import { useTranslations } from "@/components/i18n";
import { useRef, useState } from "react";
import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { FORMATS, FORMAT_LABELS, type ContentFormat } from "@/lib/viewer/types";

export function FormatPicker({
  format,
  auto,
  onChange,
}: {
  format: ContentFormat;
  auto: boolean;
  onChange: (value: ContentFormat | "auto") => void;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);
  function choose(value: ContentFormat | "auto") {
    onChange(value);
    setQuery("");
    if (menu.current) {
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
  }
  return (
    <details
      ref={menu}
      className="format-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node) &&
          menu.current
        )
          menu.current.open = false;
      }}
    >
      <summary
        aria-label={t(
          auto ? "Format : automatique, {format}" : "Format : {format}",
          { format: t(FORMAT_LABELS[format]) },
        )}
      >
        {auto && <Sparkles size={15} />} {auto ? t("Auto") : t("Format")}
        <strong>{t(FORMAT_LABELS[format])}</strong>
        <ChevronDown size={14} />
      </summary>
      <div className="format-menu-panel">
        <label className="format-search">
          <Search size={15} />
          <input
            aria-label={t("Rechercher un format")}
            placeholder={t("Rechercher…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div
          className="format-options"
          role="group"
          aria-label={t("Format du contenu")}
        >
          <button
            type="button"
            aria-pressed={auto}
            onClick={() => choose("auto")}
          >
            <Sparkles size={15} /> {t("Détection automatique")}{" "}
            {auto && <Check size={15} />}
          </button>
          {FORMATS.filter((value) =>
            t(FORMAT_LABELS[value])
              .toLocaleLowerCase(t.locale)
              .includes(query.toLocaleLowerCase(t.locale)),
          ).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={!auto && format === value}
              onClick={() => choose(value)}
            >
              {t(FORMAT_LABELS[value])}
              {!auto && format === value && <Check size={15} />}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

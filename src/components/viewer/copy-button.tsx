"use client";
import { useTranslations } from "@/components/i18n";
import { useState } from "react";
export function CopyButton({
  value,
  label = "Copier",
}: {
  value: string;
  label?: string;
}) {
  const t = useTranslations();
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copié");
    } catch {
      setStatus("Copie indisponible : sélectionnez le texte.");
    }
  }
  return (
    <span className="copy-control">
      <button type="button" className="button button-quiet" onClick={copy}>
        {t(label)}
      </button>
      <span role="status">{t(status)}</span>
    </span>
  );
}

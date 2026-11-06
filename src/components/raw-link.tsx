"use client";
import { useTranslations } from "@/components/i18n";
import { useState } from "react";
import { Link2 } from "lucide-react";
export function RawLink({ id }: { id: string }) {
  const t = useTranslations();
  const [message, setMessage] = useState("");
  return (
    <span className="copy-control">
      <a href={`/raw/${id}`} className="button button-quiet">
        {t("Raw")}
      </a>
      <button
        type="button"
        className="button button-quiet"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              `${window.location.origin}/raw/${id}`,
            );
            setMessage("Lien copié");
          } catch {
            setMessage("Copiez l’adresse du lien Raw.");
          }
        }}
      >
        <Link2 size={15} /> {t("Copier le lien raw")}
      </button>
      <span role="status">{t(message)}</span>
    </span>
  );
}

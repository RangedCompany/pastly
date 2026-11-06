"use client";
import { useTranslations } from "@/components/i18n";
import { useState } from "react";
import type { ContentFormat } from "@/lib/viewer/types";
import { downloadSource } from "@/lib/viewer/download";
import { CopyButton } from "./copy-button";
export function DocumentActions({
  content,
  format,
  filename,
}: {
  content: string;
  format: ContentFormat;
  filename: string | null;
}) {
  const t = useTranslations();
  const [source, setSource] = useState(false);
  return (
    <div>
      <div className="render-toolbar">
        <CopyButton value={content} />
        <button
          type="button"
          className="button button-quiet"
          onClick={() => downloadSource(content, format, filename)}
        >
          {t("Télécharger l’original")}
        </button>
        <button
          type="button"
          className="button button-quiet"
          aria-expanded={source}
          onClick={() => setSource(!source)}
        >
          {source ? t("Masquer la source") : t("Voir la source")}
        </button>
      </div>
      {source && (
        <pre className="document-source" tabIndex={0}>
          {content}
        </pre>
      )}
    </div>
  );
}

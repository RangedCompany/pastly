"use client";
import { useTranslations } from "@/components/i18n";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
export default function PdfRenderer({ file }: { file: File }) {
  const t = useTranslations();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<{ file: File; pdf: PDFDocumentProxy } | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true,
      task: { destroy: () => Promise<void> } | undefined;
    async function load() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      if (!active) return;
      const data = new Uint8Array(await file.arrayBuffer());
      if (!active) return;
      // PDF.js 6 removed the eval-based font path and the isEvalSupported option.
      const loadingTask = pdfjs.getDocument({
        data,
        enableXfa: false,
        useWorkerFetch: false,
        maxImageSize: 16_000_000,
        canvasMaxAreaInBytes: 64_000_000,
        disableAutoFetch: true,
        stopAtErrors: true,
      });
      task = loadingTask;
      const pdf = await loadingTask.promise;
      if (pdf.numPages > 500) {
        await loadingTask.destroy();
        throw new Error("PDF limité à 500 pages.");
      }
      if (active) {
        setDoc({ file, pdf });
        setError("");
        setPage(1);
      }
    }
    const timeout = setTimeout(() => {
      if (active) {
        void task?.destroy();
        setError("Chargement PDF interrompu après 15 secondes.");
        setLoading(false);
      }
    }, 15_000);
    load()
      .catch(() => {
        if (active) {
          setLoading(false);
          setError(
            "PDF invalide, protégé par mot de passe ou trop complexe. Téléchargez l’original pour l’ouvrir dans un lecteur adapté.",
          );
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      void task?.destroy();
    };
  }, [file]);
  useEffect(() => {
    if (doc?.file !== file) return;
    let active = true,
      renderTask: { cancel: () => void } | undefined;
    const timeout = setTimeout(() => {
      renderTask?.cancel();
      if (active) {
        setError("Rendu PDF interrompu après 15 secondes.");
        setLoading(false);
      }
    }, 15_000);
    async function render() {
      setLoading(true);
      const pdfPage = await doc!.pdf.getPage(page);
      if (!active || !canvas.current) return;
      const base = pdfPage.getViewport({ scale });
      const factor = Math.min(1, 4096 / Math.max(base.width, base.height));
      const viewport = pdfPage.getViewport({ scale: scale * factor });
      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      const context = canvas.current.getContext("2d");
      if (!context) throw new Error("Canvas indisponible.");
      const task = pdfPage.render({
        canvas: canvas.current,
        canvasContext: context,
        viewport,
      });
      renderTask = task;
      await task.promise;
      if (active) {
        setLoading(false);
        setError("");
      }
      clearTimeout(timeout);
    }
    render().catch(() => {
      if (active) {
        setLoading(false);
        setError("Cette page PDF ne peut pas être affichée.");
      }
      clearTimeout(timeout);
    });
    return () => {
      active = false;
      clearTimeout(timeout);
      renderTask?.cancel();
    };
  }, [doc, file, page, scale]);
  return (
    <div className="pdf-view">
      <div className="render-toolbar">
        <button
          type="button"
          className="button button-secondary"
          disabled={!doc || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          {t("Page précédente")}
        </button>
        <span>
          {t("Page")} {page} / {doc?.file === file ? doc.pdf.numPages : "…"}
        </span>
        <button
          type="button"
          className="button button-secondary"
          disabled={!doc || page >= doc.pdf.numPages}
          onClick={() => setPage(page + 1)}
        >
          {t("Page suivante")}
        </button>
        <label>
          {t("Zoom")}{" "}
          <select
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          >
            <option value={0.75}>75 %</option>
            <option value={1}>100 %</option>
            <option value={1.5}>150 %</option>
            <option value={2}>200 %</option>
          </select>
        </label>
      </div>
      {loading && <p role="status">{t("Rendu de la page…")}</p>}
      {t(error) && (
        <p role="alert" className="message message-error">
          {t(error)}
        </p>
      )}
      <div className="pdf-canvas">
        <canvas
          ref={canvas}
          role="img"
          aria-label={t("Page {value0} du PDF {value1}", {
            value0: page,
            value1: file.name,
          })}
        />
      </div>
      <p className="viewer-hint">
        {t(
          "Aperçu graphique avec PDF.js. Les liens, formulaires, scripts et pièces jointes du PDF ne sont pas activés.",
        )}
      </p>
    </div>
  );
}

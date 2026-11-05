"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { sanitizeSvg } from "@/lib/viewer/sanitize";
import { MAX_FILE_BYTES, MAX_TEXT_LENGTH } from "@/lib/viewer/types";
import type { OfficePreview } from "@/lib/viewer/files";
import { rasterDimensions } from "@/lib/viewer/image";
import TableRenderer from "./table-renderer";
const Pdf = dynamic(() => import("./pdf-renderer"), {
  ssr: false,
  loading: () => <p role="status">Chargement de PDF.js…</p>,
});
function ImagePreview({ file }: { file: File }) {
  const [result, setResult] = useState<{
    file: File;
    url?: string;
    error?: string;
  } | null>(null);
  useEffect(() => {
    let active = true,
      url: string | undefined;
    async function load() {
      if (file.size > MAX_FILE_BYTES)
        throw new Error("Image limitée à 10 Mio.");
      if (/\.svg$/i.test(file.name) || file.type === "image/svg+xml") {
        if (file.size > MAX_TEXT_LENGTH)
          throw new Error("SVG limité à 100 000 octets.");
        const svg = sanitizeSvg(await file.text());
        if (!active) return;
        url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      } else {
        rasterDimensions(await file.arrayBuffer());
        const bitmap = await createImageBitmap(file);
        const pixels = bitmap.width * bitmap.height;
        bitmap.close();
        if (pixels > 25_000_000)
          throw new Error("Image limitée à 25 millions de pixels.");
        if (!active) return;
        url = URL.createObjectURL(file);
      }
      setResult({ file, url });
    }
    load().catch((error) => {
      if (active)
        setResult({
          file,
          error: error instanceof Error ? error.message : "Image invalide.",
        });
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);
  if (result?.file !== file) return <p role="status">Lecture de l’image…</p>;
  if (result.error)
    return (
      <p role="alert" className="message message-error">
        {result.error}
      </p>
    );
  // SVG is sanitized, then displayed in an isolated image context.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="local-image" src={result.url} alt={file.name} />;
}
function Office({ file, kind }: { file: File; kind: "docx" | "xlsx" }) {
  const [result, setResult] = useState<{
    file: File;
    value: OfficePreview;
  } | null>(null);
  const [sheet, setSheet] = useState(0);
  useEffect(() => {
    const worker = new Worker(
      new URL("../../lib/viewer/office.worker.ts", import.meta.url),
    );
    let active = true;
    const timer = setTimeout(() => {
      worker.terminate();
      if (active)
        setResult({
          file,
          value: {
            error:
              "Lecture interrompue après 15 secondes. Téléchargez l’original pour l’ouvrir dans votre application.",
          },
        });
    }, 15_000);
    worker.onmessage = (event: MessageEvent<OfficePreview>) => {
      clearTimeout(timer);
      if (active) setResult({ file, value: event.data });
      worker.terminate();
    };
    worker.onerror = () => {
      clearTimeout(timer);
      if (active)
        setResult({
          file,
          value: { error: "Document invalide ou format non pris en charge." },
        });
      worker.terminate();
    };
    file
      .arrayBuffer()
      .then((buffer) => {
        if (active) worker.postMessage({ buffer, kind }, [buffer]);
      })
      .catch(() => {
        if (active)
          setResult({
            file,
            value: { error: "Lecture du fichier impossible." },
          });
      });
    return () => {
      active = false;
      clearTimeout(timer);
      worker.terminate();
    };
  }, [file, kind]);
  if (result?.file !== file)
    return <p role="status">Lecture du document local…</p>;
  if (result.value.error)
    return (
      <p className="message message-error" role="alert">
        {result.value.error}
      </p>
    );
  if (kind === "docx")
    return (
      <div>
        <p className="viewer-hint">
          Aperçu du texte DOCX. La mise en page, les images et les styles Word
          ne sont pas reproduits.
        </p>
        <div className="plain-view">{result.value.text}</div>
      </div>
    );
  const sheets = result.value.sheets ?? [];
  const selected = Math.min(sheet, sheets.length - 1);
  return (
    <div>
      <label>
        Feuille{" "}
        <select
          value={selected}
          onChange={(e) => setSheet(Number(e.target.value))}
        >
          {sheets.map((item, i) => (
            <option value={i} key={i}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="viewer-hint">
        Valeurs enregistrées dans le classeur ; aucune formule ni macro
        exécutée. La première ligne sert d’en-tête.
      </p>
      {sheets[selected] && (
        <TableRenderer key={selected} rows={sheets[selected].rows} />
      )}
    </div>
  );
}
export default function FilePreview({ file }: { file: File }) {
  if (file.size > MAX_FILE_BYTES)
    return <p role="alert">Fichier limité à 10 Mio.</p>;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext ?? ""))
    return <ImagePreview file={file} />;
  if (ext === "pdf") return <Pdf file={file} />;
  if (ext === "docx" || ext === "xlsx")
    return <Office file={file} kind={ext} />;
  return (
    <p>
      Ce format de fichier n’est pas pris en charge. Vous pouvez télécharger
      l’original pour l’ouvrir avec une application adaptée.
    </p>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_DIAGRAM_LENGTH } from "@/lib/viewer/types";
import { downloadBlob } from "@/lib/viewer/download";
import { sanitizeSvg } from "@/lib/viewer/sanitize";

let queue: Promise<unknown> = Promise.resolve();
let counter = 0;
async function diagram(content: string, active: () => boolean) {
  if (content.length > MAX_DIAGRAM_LENGTH)
    throw new Error("Diagramme limité à 20 000 caractères.");
  if (content.split(/[\n;]/).length > 500)
    throw new Error("Diagramme limité à 500 lignes ou instructions.");
  if (/%%\{|^\s*---/m.test(content))
    throw new Error(
      "Les directives et configurations Mermaid intégrées sont désactivées. Retirez-les pour visualiser le diagramme.",
    );
  const task = queue
    .catch(() => {})
    .then(async () => {
      if (!active()) throw new Error("Rendu remplacé par une nouvelle source.");
      const { default: mermaid } = await import("mermaid");
      if (!active()) throw new Error("Rendu remplacé par une nouvelle source.");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        maxTextSize: MAX_DIAGRAM_LENGTH,
        maxEdges: 200,
        suppressErrorRendering: true,
        theme: "neutral",
        htmlLabels: false,
        flowchart: { htmlLabels: false },
        secure: [
          "secure",
          "securityLevel",
          "startOnLoad",
          "maxTextSize",
          "maxEdges",
          "htmlLabels",
          "themeCSS",
          "dompurifyConfig",
        ],
      });
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-100000px;top:0;visibility:hidden";
      document.body.append(container);
      try {
        await mermaid.parse(content);
        const { svg } = await mermaid.render(
          `pastly-diagram-${++counter}`,
          content,
          container,
        );
        return sanitizeSvg(svg);
      } finally {
        container.remove();
      }
    });
  queue = task;
  return task;
}
export default function MermaidRenderer({ content }: { content: string }) {
  const [result, setResult] = useState<{
    source: string;
    svg?: string;
    url?: string;
    error?: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [exportError, setExportError] = useState("");
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    let active = true,
      url: string | undefined;
    diagram(content, () => active)
      .then((svg) => {
        if (active) {
          url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
          setResult({ source: content, svg, url });
        }
      })
      .catch((error) => {
        if (active)
          setResult({
            source: content,
            error: String(error instanceof Error ? error.message : error).slice(
              0,
              500,
            ),
          });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [content]);
  async function png() {
    try {
      const image = img.current;
      if (!image?.complete || !image.naturalWidth)
        throw new Error("Attendez le chargement du diagramme.");
      const factor = Math.min(
        2,
        4096 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, image.naturalWidth * factor);
      canvas.height = Math.max(1, image.naturalHeight * factor);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Export PNG indisponible.");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "pastly-diagramme.png");
        else setExportError("Export PNG indisponible. Utilisez SVG.");
      }, "image/png");
    } catch {
      setExportError("Export PNG indisponible. Utilisez SVG.");
    }
  }
  if (result?.source !== content)
    return <p role="status">Création du diagramme…</p>;
  if (result.error)
    return (
      <p className="message message-error" role="alert">
        Syntaxe Mermaid : {result.error}
      </p>
    );
  return (
    <div className="mermaid-view">
      <div className="render-toolbar">
        <button
          className="button button-quiet"
          type="button"
          aria-label="Réduire le diagramme"
          onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
        >
          −
        </button>
        <button
          className="button button-quiet"
          type="button"
          onClick={() => setZoom(1)}
        >
          Adapter à la largeur
        </button>
        <button
          className="button button-quiet"
          type="button"
          aria-label="Agrandir le diagramme"
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
        >
          +
        </button>
        <span>{Math.round(zoom * 100)} %</span>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            downloadBlob(
              new Blob([result.svg!], { type: "image/svg+xml" }),
              "pastly-diagramme.svg",
            )
          }
        >
          Exporter SVG
        </button>
        <button className="button button-secondary" type="button" onClick={png}>
          Exporter PNG
        </button>
      </div>
      <div
        className="diagram-scroll"
        tabIndex={0}
        role="region"
        aria-label="Diagramme Mermaid"
      >
        {/* Blob SVG displayed as an image: no active document or script context. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          src={result.url}
          alt="Diagramme Mermaid généré depuis votre source"
          style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
        />
      </div>
      {exportError && <p role="status">{exportError}</p>}
    </div>
  );
}

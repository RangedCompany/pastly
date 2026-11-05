"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getRenderer } from "@/lib/viewer/registry";
import { RendererBoundary } from "./renderer-boundary";
import {
  MAX_TEXT_LENGTH,
  type ContentFormat,
  type ParseResult,
} from "@/lib/viewer/types";
const loading = () => <p role="status">Chargement du visualiseur…</p>;
const Markdown = dynamic(() => import("./markdown-renderer"), { loading });
const Mermaid = dynamic(() => import("./mermaid-renderer"), { loading });
const Code = dynamic(() => import("./code-renderer"), { loading });
const Structured = dynamic(() => import("./structured-renderer"), { loading });
const Table = dynamic(() => import("./table-renderer"), { loading });

export function ContentPreview({
  content,
  format,
  color = "yellow",
}: {
  content: string;
  format: ContentFormat;
  color?: string;
}) {
  const renderer = getRenderer(format);
  const [parsed, setParsed] = useState<{
    content: string;
    format: string;
    result: ParseResult;
  } | null>(null);
  useEffect(() => {
    if (
      !["structured", "table"].includes(renderer.id) ||
      content.length > MAX_TEXT_LENGTH
    )
      return;
    const worker = new Worker(
      new URL("../../lib/viewer/parse.worker.ts", import.meta.url),
    );
    const timer = setTimeout(() => {
      worker.terminate();
      setParsed({
        content,
        format,
        result: {
          diagnostics: [
            {
              severity: "error",
              message:
                "Analyse interrompue après 5 secondes. La source reste disponible.",
            },
          ],
        },
      });
    }, 5000);
    worker.onmessage = (event: MessageEvent<ParseResult>) => {
      clearTimeout(timer);
      setParsed({ content, format, result: event.data });
    };
    worker.onerror = () => {
      clearTimeout(timer);
      setParsed({
        content,
        format,
        result: {
          diagnostics: [
            {
              severity: "error",
              message: "Analyse impossible. Consultez la source.",
            },
          ],
        },
      });
    };
    worker.postMessage({ content, format });
    return () => {
      clearTimeout(timer);
      worker.terminate();
    };
  }, [content, format, renderer.id]);
  if (!content)
    return (
      <div className="preview-placeholder">
        <strong>Votre contenu, plus lisible.</strong>
        <p>Collez du texte ou ouvrez un fichier pour commencer.</p>
      </div>
    );
  if (content.length > MAX_TEXT_LENGTH)
    return (
      <p className="message message-error" role="alert">
        Le contenu est limité à 100 000 caractères.
      </p>
    );
  const result =
    parsed?.content === content && parsed.format === format
      ? parsed.result
      : null;
  const components = {
    text: () => (
      <div
        className={
          format === "note" ? `viewer-paper paper-${color}` : "plain-view"
        }
      >
        {content}
      </div>
    ),
    markdown: () => <Markdown content={content} />,
    mermaid: () => <Mermaid content={content} />,
    code: () => (
      <Code content={content} language={format === "code" ? "text" : format} />
    ),
    structured: () => result && <Structured value={result.value} />,
    table: () => result?.rows && <Table rows={result.rows} />,
  };
  if (["structured", "table"].includes(renderer.id)) {
    if (!result) return loading();
    if (result.diagnostics.length)
      return (
        <div>
          {result.diagnostics.map((d, i) => (
            <p className="message message-error" key={i} role="alert">
              {d.message}
            </p>
          ))}
          <p className="viewer-hint">
            Choisissez Source ou Split pour corriger le contenu.
          </p>
        </div>
      );
  }
  return (
    <div className="content-renderer" data-format={format}>
      <RendererBoundary content={content} format={format}>
        {components[renderer.id]()}
      </RendererBoundary>
    </div>
  );
}

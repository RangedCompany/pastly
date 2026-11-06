"use client";
import { useTranslations } from "@/components/i18n";
import { TranslatedText } from "@/components/i18n";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import dynamic from "next/dynamic";
const Code = dynamic(() => import("./code-renderer"), {
  loading: () => (
    <p role="status">
      <TranslatedText text={"Coloration…"} />
    </p>
  ),
});
const Mermaid = dynamic(() => import("./mermaid-renderer"), {
  loading: () => (
    <p role="status">
      <TranslatedText text={"Chargement du diagramme…"} />
    </p>
  ),
});
function RemoteImage({ src, alt }: { src?: string; alt?: string }) {
  const t = useTranslations();
  const [loaded, setLoaded] = useState(false);
  let hostname: string | null = null;
  try {
    if (src && /^https?:\/\//i.test(src)) hostname = new URL(src).hostname;
  } catch {
    /* Malformed user URLs stay inert. */
  }
  if (!hostname)
    return (
      <span>
        {t("[Image :")} {alt || t("adresse non autorisée")}]
      </span>
    );
  if (!loaded)
    return (
      <button
        className="button button-secondary"
        type="button"
        onClick={() => setLoaded(true)}
      >
        {t("Charger l’image externe :")} {alt || hostname}
      </button>
    );
  // Explicit opt-in prevents a pasted document from silently contacting image hosts.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || t("Image du document")}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
export default function MarkdownRenderer({ content }: { content: string }) {
  const t = useTranslations();
  if ((content.match(/^(?:`{3,}|~{3,})mermaid\s*$/gm) ?? []).length > 10)
    return (
      <p className="message message-error" role="alert">
        {t(
          "Ce document contient plus de 10 diagrammes intégrés. Réduisez leur nombre ou consultez la source.",
        )}
      </p>
    );
  return (
    <div className="markdown-body">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeSanitize,
          [
            rehypeKatex,
            { trust: false, strict: "ignore", maxExpand: 100, maxSize: 20 },
          ],
        ]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <RemoteImage
              src={typeof src === "string" ? src : undefined}
              alt={alt}
            />
          ),
          pre: ({ children }) => (
            <div className="markdown-code-block">{children}</div>
          ),
          code: ({ className, children }) => {
            const language = /language-([\w+-]+)/.exec(className ?? "")?.[1];
            const text = String(children);
            if (language === "mermaid") return <Mermaid content={text} />;
            if (language || text.includes("\n"))
              return <Code content={text} language={language || "text"} />;
            return <code>{children}</code>;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

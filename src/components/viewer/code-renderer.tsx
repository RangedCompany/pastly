"use client";
import { useTranslations } from "@/components/i18n";
import { useEffect, useState } from "react";
import type { BundledLanguage, ThemedToken } from "shiki";
import { CopyButton } from "./copy-button";
export default function CodeRenderer({
  content,
  language = "text",
}: {
  content: string;
  language?: string;
}) {
  const t = useTranslations();
  const [result, setResult] = useState<{
    source: string;
    language: string;
    tokens: ThemedToken[][];
  } | null>(null);
  useEffect(() => {
    let active = true;
    if (content.length <= 30_000) {
      import("shiki")
        .then(async ({ codeToTokens, bundledLanguages }) => {
          const lang =
            language in bundledLanguages
              ? (language as BundledLanguage)
              : "text";
          const result = await codeToTokens(content, {
            lang,
            theme: "github-light",
          });
          if (active)
            setResult({ source: content, language, tokens: result.tokens });
        })
        .catch(() => {
          /* Plain source remains readable if highlighting fails. */
        });
    }
    return () => {
      active = false;
    };
  }, [content, language]);
  const tokens =
    result?.source === content && result.language === language
      ? result.tokens
      : null;
  const lines = content.split("\n");
  return (
    <div className="code-view">
      <div className="render-toolbar">
        <span>{language === "text" ? t("Source") : language}</span>
        <CopyButton value={content} />
      </div>
      {content.length > 30_000 && (
        <p className="viewer-hint">
          {t(
            "Coloration désactivée au-delà de 30 000 caractères ; source intégrale conservée.",
          )}
        </p>
      )}
      <pre tabIndex={0} aria-label={t("Code source")}>
        <code>
          {tokens
            ? tokens.map((line, i) => (
                <span className="code-line" key={i}>
                  {line.map((token, j) => (
                    <span key={j} style={{ color: token.color }}>
                      {token.content}
                    </span>
                  ))}
                  {i < tokens.length - 1 ? "\n" : ""}
                </span>
              ))
            : lines.map((line, i) => (
                <span className="code-line" key={i}>
                  {line}
                  {i < lines.length - 1 ? "\n" : ""}
                </span>
              ))}
        </code>
      </pre>
    </div>
  );
}

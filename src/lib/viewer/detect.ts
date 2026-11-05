import {
  MAX_TEXT_LENGTH,
  type ContentInput,
  type ContentFormat,
  type Detection,
} from "./types";

export const EXTENSIONS: Record<string, ContentFormat> = {
  txt: "text",
  md: "markdown",
  markdown: "markdown",
  mmd: "mermaid",
  mermaid: "mermaid",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  csv: "csv",
  tsv: "tsv",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  html: "html",
  htm: "html",
  css: "css",
  sql: "sql",
  sh: "bash",
  bash: "bash",
};
const MIMES: Record<string, ContentFormat> = {
  "application/json": "json",
  "text/markdown": "markdown",
  "application/yaml": "yaml",
  "text/yaml": "yaml",
  "application/toml": "toml",
  "application/xml": "xml",
  "text/xml": "xml",
  "text/csv": "csv",
  "text/tab-separated-values": "tsv",
  "text/javascript": "javascript",
  "text/html": "html",
  "text/css": "css",
};
export const MERMAID_START =
  /^(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b|^(?:sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|xychart-beta|requirementDiagram|C4Context|sankey-beta|block-beta|architecture-beta|packet-beta|kanban)\b/m;

export function detectContent({
  content,
  filename,
  mime,
}: ContentInput): Detection {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext && EXTENSIONS[ext])
    return {
      format: EXTENSIONS[ext],
      confidence: "high",
      reason: "Extension du fichier",
    };
  const mimeFormat = mime && MIMES[mime.split(";")[0]];
  if (mimeFormat)
    return {
      format: mimeFormat,
      confidence: "high",
      reason: "Type du fichier",
    };
  const source = content.trim();
  if (source.length > MAX_TEXT_LENGTH)
    return {
      format: "text",
      confidence: "fallback",
      reason: "Contenu trop volumineux",
    };
  try {
    if (source) {
      JSON.parse(source);
      return { format: "json", confidence: "high", reason: "JSON valide" };
    }
  } catch {
    /* A broken JSON or ambiguous document remains plain text. */
  }
  const firstLine = source.replace(/^(?:%%[^\n]*\n\s*)+/, "").split("\n", 1)[0];
  if (MERMAID_START.test(firstLine))
    return {
      format: "mermaid",
      confidence: "medium",
      reason: "Déclaration Mermaid (syntaxe vérifiée au rendu)",
    };
  if (
    /^(?:#{1,6}\s+\S|```\w*\s*$|>\s+\S|\s*[-*]\s+\[[ xX]\])/m.test(source) ||
    /\[[^\]\n]+\]\(https?:\/\/[^)]+\)/.test(source) ||
    /^\s*\|?.+\|.+\n\s*\|?\s*:?-{3,}/m.test(source)
  )
    return {
      format: "markdown",
      confidence: "medium",
      reason: "Marqueurs Markdown",
    };
  if (/^<\?xml\b/.test(source))
    return { format: "xml", confidence: "high", reason: "Déclaration XML" };
  if (/^#!.*\b(?:bash|sh)\b/.test(source))
    return {
      format: "bash",
      confidence: "high",
      reason: "Interpréteur déclaré",
    };
  if (
    /^(?:export\s+)?(?:interface|type)\s+\w+\s*(?:[={]|extends\b)/m.test(source)
  )
    return {
      format: "typescript",
      confidence: "medium",
      reason: "Déclaration TypeScript",
    };
  if (
    /^(?:export\s+)?(?:async\s+)?function\s+\w+\([^)]*\)\s*\{|^(?:const|let)\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>/m.test(
      source,
    )
  )
    return {
      format: "javascript",
      confidence: "medium",
      reason: "Déclaration JavaScript",
    };
  if (/^def\s+\w+\([^)]*\)\s*(?:->[^:]+)?:\s*\n[ \t]+\S/m.test(source))
    return {
      format: "python",
      confidence: "medium",
      reason: "Déclaration Python",
    };
  if (/^(?:pub\s+)?fn\s+\w+\(/m.test(source))
    return { format: "rust", confidence: "medium", reason: "Déclaration Rust" };
  if (/^package\s+\w+\s*\n/.test(source) && /\bfunc\s+\w+\(/.test(source))
    return { format: "go", confidence: "medium", reason: "Déclaration Go" };
  return {
    format: "text",
    confidence: "fallback",
    reason: "Texte ou format ambigu : choisissez un format si nécessaire",
  };
}

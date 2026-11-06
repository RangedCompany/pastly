export const FORMATS = [
  "text",
  "note",
  "markdown",
  "mermaid",
  "json",
  "yaml",
  "toml",
  "xml",
  "csv",
  "tsv",
  "code",
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "html",
  "css",
  "sql",
  "bash",
] as const;
export type ContentFormat = (typeof FORMATS)[number];
export type ContentKind =
  "note" | "text" | "markdown" | "code" | "diagram" | "data";
export type ContentInput = {
  content: string;
  filename?: string | null;
  mime?: string;
};
export type Detection = {
  format: ContentFormat;
  confidence: "high" | "medium" | "fallback";
  reason: string;
};
export type Diagnostic = { message: string; severity: "error" | "warning" };
export type ParseResult = {
  value?: unknown;
  rows?: string[][];
  diagnostics: Diagnostic[];
};
export type RendererId =
  "text" | "markdown" | "mermaid" | "structured" | "code" | "table";
export interface RendererPlugin {
  id: RendererId;
  formats: readonly ContentFormat[];
  extensions: readonly string[];
  mimeTypes: readonly string[];
  capabilities: readonly (
    "copy" | "source" | "download" | "tree" | "sort" | "zoom" | "svg" | "png"
  )[];
  parse: (input: ContentInput, format: ContentFormat) => Promise<ParseResult>;
}
export const MAX_TEXT_LENGTH = 100_000;
export const MAX_NOTE_LENGTH = 5_000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_DIAGRAM_LENGTH = 20_000;
export const FORMAT_LABELS: Record<ContentFormat, string> = {
  text: "Texte brut",
  note: "Note colorée",
  markdown: "Markdown",
  mermaid: "Mermaid",
  json: "JSON",
  yaml: "YAML",
  toml: "TOML",
  xml: "XML",
  csv: "CSV",
  tsv: "TSV",
  code: "Code",
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  rust: "Rust",
  go: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  bash: "Bash",
};
export const CODE_FORMATS: readonly ContentFormat[] = [
  "code",
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "html",
  "css",
  "sql",
  "bash",
];
export function contentKind(format: ContentFormat): ContentKind {
  if (CODE_FORMATS.includes(format)) return "code";
  if (["json", "yaml", "toml", "xml", "csv", "tsv"].includes(format))
    return "data";
  if (format === "mermaid") return "diagram";
  return format as "text" | "note" | "markdown";
}

import {
  CODE_FORMATS,
  FORMATS,
  MAX_DIAGRAM_LENGTH,
  MAX_TEXT_LENGTH,
  type ContentFormat,
  type ContentInput,
  type ParseResult,
  type RendererPlugin,
} from "./types";

const source = async (): Promise<ParseResult> => ({ diagnostics: [] });
const plugins: readonly RendererPlugin[] = [
  {
    id: "text",
    formats: ["text", "note"],
    extensions: ["txt"],
    mimeTypes: ["text/plain"],
    capabilities: ["copy", "source", "download"],
    parse: source,
  },
  {
    id: "markdown",
    formats: ["markdown"],
    extensions: ["md", "markdown"],
    mimeTypes: ["text/markdown"],
    capabilities: ["copy", "source", "download"],
    parse: source,
  },
  {
    id: "mermaid",
    formats: ["mermaid"],
    extensions: ["mmd", "mermaid"],
    mimeTypes: ["text/vnd.mermaid"],
    capabilities: ["copy", "source", "download", "zoom", "svg", "png"],
    parse: async ({ content }) => ({
      diagnostics:
        content.length > MAX_DIAGRAM_LENGTH
          ? [
              {
                severity: "error",
                message:
                  "Diagramme limité à 20 000 caractères. La source reste disponible.",
              },
            ]
          : [],
    }),
  },
  {
    id: "structured",
    formats: ["json", "yaml", "toml", "xml"],
    extensions: ["json", "yaml", "yml", "toml", "xml"],
    mimeTypes: [
      "application/json",
      "application/yaml",
      "application/toml",
      "application/xml",
    ],
    capabilities: ["copy", "source", "download", "tree"],
    parse: async (input, format) =>
      (await import("./parse")).parseStructured(input.content, format),
  },
  {
    id: "code",
    formats: CODE_FORMATS,
    extensions: [
      "ts",
      "js",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "html",
      "css",
      "sql",
      "sh",
    ],
    mimeTypes: ["text/javascript", "text/html", "text/css"],
    capabilities: ["copy", "source", "download"],
    parse: source,
  },
  {
    id: "table",
    formats: ["csv", "tsv"],
    extensions: ["csv", "tsv"],
    mimeTypes: ["text/csv", "text/tab-separated-values"],
    capabilities: ["copy", "source", "download", "sort"],
    parse: async (input, format) =>
      (await import("./parse")).parseStructured(input.content, format),
  },
];
export function getSupportedFormats() {
  return FORMATS;
}
export function getRenderer(format: ContentFormat): RendererPlugin {
  return plugins.find((p) => p.formats.includes(format)) ?? plugins[0];
}
export async function renderContent(
  input: ContentInput,
  format: ContentFormat,
): Promise<ParseResult> {
  if (input.content.length > MAX_TEXT_LENGTH)
    return {
      diagnostics: [
        {
          severity: "error",
          message: "Le contenu est limité à 100 000 caractères.",
        },
      ],
    };
  try {
    return await getRenderer(format).parse(input, format);
  } catch (error) {
    return {
      diagnostics: [
        {
          severity: "error",
          message:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Impossible de lire ce contenu.",
        },
      ],
    };
  }
}

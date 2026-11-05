import { describe, expect, it } from "vitest";
import { detectContent } from "../src/lib/viewer/detect";
import {
  getRenderer,
  getSupportedFormats,
  renderContent,
} from "../src/lib/viewer/registry";
import { checkStructure } from "../src/lib/viewer/parse";
import { noteSchema } from "../src/lib/validation";
import { normalizeOfficeArchive } from "../src/lib/viewer/files";
import { rasterDimensions } from "../src/lib/viewer/image";
import { zipSync, strToU8, unzipSync } from "fflate";

describe("détection locale et contrat des renderers", () => {
  it.each([
    ["Bonjour, une idée", "text"],
    ["Un nom: une valeur", "text"],
    ["a,b\n1,2", "text"],
    ['{"a":[1,true,null]}', "json"],
    ["42", "json"],
    ['{"cassé":', "text"],
    ["# Un titre\n\nBonjour", "markdown"],
    ["| Nom | Valeur |\n| --- | --- |\n| A | B |", "markdown"],
    ["flowchart LR\n A --> B", "mermaid"],
    ["sequenceDiagram\n Alice->>Bob: Bonjour", "mermaid"],
    ["interface Idee {\n titre: string;\n}", "typescript"],
    ["def salut():\n    return 1", "python"],
  ])("détecte %s comme %s", (content, expected) =>
    expect(detectContent({ content }).format).toBe(expected),
  );
  it("privilégie extension puis MIME fiable et conserve les ambiguïtés", () => {
    expect(
      detectContent({
        content: "{}",
        filename: "texte.md",
        mime: "application/json",
      }).format,
    ).toBe("markdown");
    expect(
      detectContent({ content: "a: b", mime: "text/yaml; charset=utf-8" })
        .format,
    ).toBe("yaml");
    expect(
      detectContent({ content: "a: b", mime: "application/octet-stream" })
        .confidence,
    ).toBe("fallback");
    expect(
      detectContent({
        content: "# Document\n```mermaid\nflowchart LR\n A-->B\n```",
      }).format,
    ).toBe("markdown");
  });
  it("expose un contrat pour chaque format, sans charger les renderers UI", () => {
    for (const format of getSupportedFormats()) {
      const plugin = getRenderer(format);
      expect(plugin.formats).toContain(format);
      expect(plugin.capabilities).toContain("source");
      expect(plugin.extensions.length).toBeGreaterThan(0);
      expect(plugin.mimeTypes.length).toBeGreaterThan(0);
    }
  });
});
describe("parsing, diagnostics et garde-fous", () => {
  it.each([
    ['{"a":[1,true,null]}', "json", { a: [1, true, null] }],
    [
      "titre: Pastly\nliste:\n  - oui",
      "yaml",
      { titre: "Pastly", liste: ["oui"] },
    ],
    ['[app]\nnom = "Pastly"', "toml", { app: { nom: "Pastly" } }],
    ["<app><nom>Pastly</nom></app>", "xml", { app: { nom: "Pastly" } }],
  ] as const)("parse %s", async (content, format, expected) => {
    const result = await renderContent({ content }, format);
    expect(result.diagnostics).toEqual([]);
    expect(result.value).toEqual(expected);
  });
  it.each([
    ["{", "json"],
    ["a: [1,", "yaml"],
    ["x = [", "toml"],
    ["<app>", "xml"],
    ['<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x>&e;</x>', "xml"],
    ['a,b\n"inachevé', "csv"],
  ] as const)("signale les erreurs de %s", async (content, format) =>
    expect(
      (await renderContent({ content }, format)).diagnostics[0].severity,
    ).toBe("error"),
  );
  it("parse les virgules, doubles guillemets et lignes à l’intérieur d’un champ CSV", async () => {
    const result = await renderContent(
      { content: 'nom,texte\nAlice,"Bonjour, ""Pastly"""\nBob,"deux\nlignes"' },
      "csv",
    );
    expect(result.rows).toEqual([
      ["nom", "texte"],
      ["Alice", 'Bonjour, "Pastly"'],
      ["Bob", "deux\nlignes"],
    ]);
  });
  it("parse TSV et refuse les colonnes incohérentes", async () => {
    expect(
      (await renderContent({ content: "a\tb\n1\t2" }, "tsv")).rows,
    ).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(
      (await renderContent({ content: "a,b\n1,2,3" }, "csv")).diagnostics,
    ).toHaveLength(1);
  });
  it("interdit les structures profondes et alias YAML cycliques", async () => {
    let value: unknown = {};
    for (let i = 0; i < 82; i++) value = { value };
    expect(() => checkStructure(value)).toThrow(/complexe/);
    expect(
      (await renderContent({ content: "a: &a\n  b: *a" }, "yaml")).diagnostics,
    ).toHaveLength(1);
    expect(
      (await renderContent({ content: "x".repeat(100001) }, "text"))
        .diagnostics,
    ).toHaveLength(1);
  });
  it("ne transforme jamais une source et limite indépendamment les post-it", () => {
    const content = "  \tconst exemple = 1;  \n\n";
    const result = noteSchema.parse({
      title: " Code ",
      content,
      color: "blue",
      format: "typescript",
    });
    expect(result.content).toBe(content);
    expect(result.is_public).toBe(false);
    expect(result.content_kind).toBe("code");
    expect(
      noteSchema.safeParse({
        ...result,
        format: "note",
        content: "a".repeat(5001),
      }).success,
    ).toBe(false);
    expect(
      noteSchema.safeParse({ ...result, metadata: { script: true } }).success,
    ).toBe(false);
  });
});
describe("fichiers Office locaux", () => {
  it("refuse les fichiers invalides, les entités XML et les archives explosives", () => {
    expect(() => normalizeOfficeArchive(new ArrayBuffer(2), "docx")).toThrow();
    const entity = zipSync({
      "word/document.xml": strToU8("<!DOCTYPE x><x/>"),
    });
    expect(() =>
      normalizeOfficeArchive(entity.buffer as ArrayBuffer, "docx"),
    ).toThrow(/entités/);
    const bomb = zipSync({
      "word/document.xml": new Uint8Array(6 * 1024 * 1024),
    });
    expect(() =>
      normalizeOfficeArchive(bomb.buffer as ArrayBuffer, "docx"),
    ).toThrow(/volumineuse/);
  });
  it("refuse les cellules XLSX hors des bornes", () => {
    const file = zipSync({
      "xl/workbook.xml": strToU8("<workbook/>"),
      "xl/worksheets/sheet1.xml": strToU8(
        '<worksheet><c r="A999999999"/></worksheet>',
      ),
    });
    expect(() =>
      normalizeOfficeArchive(file.buffer as ArrayBuffer, "xlsx"),
    ).toThrow(/limitée/);
  });
  it("conserve le texte XML du DOCX dans le conteneur normalisé", () => {
    const archive = zipSync({
      "[Content_Types].xml": strToU8(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
      "_rels/.rels": strToU8(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      "word/document.xml": strToU8(
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Bonjour &lt;script&gt;alert(1)&lt;/script&gt;</w:t></w:r></w:p></w:body></w:document>',
      ),
    });
    const normalized = normalizeOfficeArchive(
      archive.buffer as ArrayBuffer,
      "docx",
    );
    const xml = new TextDecoder().decode(
      unzipSync(new Uint8Array(normalized))["word/document.xml"],
    );
    expect(xml).toContain("Bonjour &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
describe("limites des images avant décodage", () => {
  it("lit les dimensions PNG et refuse une image démesurée avant allocation", () => {
    const data = new Uint8Array(24);
    data.set([137, 80, 78, 71], 0);
    data.set([73, 72, 68, 82], 12);
    const view = new DataView(data.buffer);
    view.setUint32(16, 400);
    view.setUint32(20, 300);
    expect(rasterDimensions(data.buffer)).toEqual({ width: 400, height: 300 });
    view.setUint32(16, 100000);
    expect(() => rasterDimensions(data.buffer)).toThrow(/pixels/);
    expect(() => rasterDimensions(new ArrayBuffer(2))).toThrow(/invalide/);
  });
});

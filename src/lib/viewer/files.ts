import { unzipSync, zipSync } from "fflate";
import { MAX_FILE_BYTES, MAX_TEXT_LENGTH } from "./types";
export type OfficePreview = {
  text?: string;
  sheets?: { name: string; rows: string[][] }[];
  error?: string;
};
export function normalizeOfficeArchive(
  buffer: ArrayBuffer,
  kind: "docx" | "xlsx",
) {
  if (buffer.byteLength > MAX_FILE_BYTES)
    throw new Error("Fichier limité à 10 Mio.");
  const bytes = new Uint8Array(buffer);
  let total = 0,
    count = 0;
  // Inspect the central directory without inflating. ZIP64, encrypted or exotic archives fail closed.
  unzipSync(bytes, {
    filter: (entry) => {
      total += entry.originalSize;
      if (
        ++count > 1000 ||
        total > 20 * 1024 * 1024 ||
        entry.originalSize > 5 * 1024 * 1024 ||
        !Number.isSafeInteger(entry.originalSize) ||
        entry.name.split("/").includes("..")
      )
        throw new Error(
          "Archive trop volumineuse ou trop complexe (20 Mio décompressés, 1 000 entrées).",
        );
      return false;
    },
  });
  const files = unzipSync(bytes, {
    filter: (entry) => /\.(?:xml|rels)$/i.test(entry.name),
  });
  let actual = 0;
  for (const [name, data] of Object.entries(files)) {
    actual += data.byteLength;
    if (actual > 20 * 1024 * 1024)
      throw new Error("Archive décompressée trop volumineuse.");
    const xml = new TextDecoder().decode(data);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml))
      throw new Error("Les DTD et entités XML des documents sont désactivées.");
    if (kind === "xlsx" && /^xl\/worksheets\/.*\.xml$/.test(name)) {
      let cells = 0;
      for (const match of xml.matchAll(/\br=["']([A-Z]+)(\d+)["']/g)) {
        let col = 0;
        for (const letter of match[1])
          col = col * 26 + letter.charCodeAt(0) - 64;
        if (++cells > 50_000 || col > 200 || Number(match[2]) > 10_001)
          throw new Error(
            "Feuille limitée à 10 000 lignes, 200 colonnes et 50 000 cellules.",
          );
      }
      for (const match of xml.matchAll(
        /<(?:\w+:)?dimension\b[^>]*ref=["']([^"']+)/g,
      )) {
        for (const cell of match[1].split(":")) {
          const ref = /^([A-Z]+)(\d+)$/.exec(cell);
          let lastColumn = 0;
          if (ref)
            for (const letter of ref[1])
              lastColumn = lastColumn * 26 + letter.charCodeAt(0) - 64;
          if (!ref || lastColumn > 200 || Number(ref[2]) > 10_001)
            throw new Error("Dimensions de feuille trop importantes.");
        }
      }
    }
  }
  if (!files[kind === "docx" ? "word/document.xml" : "xl/workbook.xml"])
    throw new Error(
      `Ce fichier n’est pas un document ${kind.toUpperCase()} valide.`,
    );
  return zipSync(files, { level: 0 }).buffer as ArrayBuffer;
}
export async function parseOffice(
  buffer: ArrayBuffer,
  kind: "docx" | "xlsx",
): Promise<OfficePreview> {
  const normalized = normalizeOfficeArchive(buffer, kind);
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: normalized });
    if (result.value.length > MAX_TEXT_LENGTH)
      throw new Error("Aperçu DOCX limité à 100 000 caractères.");
    return { text: result.value };
  }
  const { default: readXlsxFile } = await import("read-excel-file/universal");
  const result = await readXlsxFile(normalized, { trim: false });
  if (result.length > 20) throw new Error("Classeur limité à 20 feuilles.");
  let cells = 0;
  return {
    sheets: result.map((sheet) => {
      const width = Math.max(0, ...sheet.data.map((row) => row.length));
      if (
        sheet.data.length > 10_001 ||
        width > 200 ||
        (cells += sheet.data.reduce((n, row) => n + row.length, 0)) > 100_000
      )
        throw new Error(
          "Classeur trop volumineux : 100 000 cellules au total au maximum.",
        );
      return {
        name: sheet.sheet,
        rows: sheet.data.map((row) =>
          Array.from({ length: width }, (_, i) =>
            row[i] instanceof Date
              ? row[i].toISOString()
              : String(row[i] ?? ""),
          ),
        ),
      };
    }),
  };
}

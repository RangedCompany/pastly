import { parseDocument } from "yaml";
import { parse as parseToml } from "smol-toml";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import Papa from "papaparse";
import { MAX_TEXT_LENGTH, type ContentFormat, type ParseResult } from "./types";

// Bound both depth and breadth before passing data to an interactive renderer.
export function checkStructure(value: unknown) {
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let count = 0;
  const seen = new WeakSet<object>();
  while (pending.length) {
    const item = pending.pop()!;
    if (++count > 20_000 || item.depth > 80)
      throw new Error(
        "Structure trop complexe : limite de 20 000 valeurs et 80 niveaux. Consultez la source.",
      );
    if (item.value && typeof item.value === "object") {
      if (seen.has(item.value))
        throw new Error(
          "Les références YAML cycliques ou partagées ne sont pas prises en charge. Consultez la source.",
        );
      seen.add(item.value);
      for (const child of Object.values(item.value))
        pending.push({ value: child, depth: item.depth + 1 });
    }
  }
}
export async function parseStructured(
  content: string,
  format: ContentFormat,
): Promise<ParseResult> {
  if (content.length > MAX_TEXT_LENGTH)
    throw new Error("Le contenu est limité à 100 000 caractères.");
  // Ignore the UTF-8 file marker for parsing only; preserve the original source.
  const input = content.startsWith("\uFEFF") ? content.slice(1) : content;
  let value: unknown;
  switch (format) {
    case "json":
      value = JSON.parse(input);
      break;
    case "yaml": {
      const doc = parseDocument(input, { uniqueKeys: true, schema: "core" });
      if (doc.errors.length) throw new Error(doc.errors[0].message);
      value = doc.toJS({ maxAliasCount: 50 });
      break;
    }
    case "toml":
      value = parseToml(input);
      break;
    case "xml": {
      if (/<!DOCTYPE|<!ENTITY/i.test(content))
        throw new Error(
          "Les DTD et entités XML sont désactivées pour votre sécurité.",
        );
      const valid = XMLValidator.validate(input);
      if (valid !== true)
        throw new Error(`XML : ${valid.err.msg} (ligne ${valid.err.line}).`);
      value = new XMLParser({
        ignoreAttributes: false,
        processEntities: false,
        htmlEntities: false,
      }).parse(input);
      break;
    }
    case "csv":
    case "tsv": {
      const result = Papa.parse<string[]>(input, {
        delimiter: format === "tsv" ? "\t" : ",",
        skipEmptyLines: "greedy",
      });
      if (result.errors.length)
        throw new Error(
          `CSV : ${result.errors[0].message} (ligne ${(result.errors[0].row ?? 0) + 1}).`,
        );
      if (
        result.data.length > 10_001 ||
        result.data.some((row) => row.length > 200)
      )
        throw new Error("Tableau limité à 10 000 lignes et 200 colonnes.");
      if (result.data.some((row) => row.length !== result.data[0]?.length))
        throw new Error(
          "Le nombre de colonnes varie entre les lignes. Vérifiez le séparateur choisi.",
        );
      return { rows: result.data, diagnostics: [] };
    }
    default:
      return { diagnostics: [] };
  }
  checkStructure(value);
  return { value, diagnostics: [] };
}

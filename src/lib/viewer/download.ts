import { EXTENSIONS } from "./detect";
import type { ContentFormat } from "./types";
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export function downloadSource(
  content: string,
  format: ContentFormat,
  filename?: string | null,
) {
  const ext =
    Object.keys(EXTENSIONS).find((key) => EXTENSIONS[key] === format) ?? "txt";
  downloadBlob(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
    filename || `pastly.${ext}`,
  );
}

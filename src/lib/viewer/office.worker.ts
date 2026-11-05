import { parseOffice } from "./files";
self.onmessage = async (
  event: MessageEvent<{ buffer: ArrayBuffer; kind: "docx" | "xlsx" }>,
) => {
  try {
    self.postMessage(await parseOffice(event.data.buffer, event.data.kind));
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Document invalide.",
    });
  }
};

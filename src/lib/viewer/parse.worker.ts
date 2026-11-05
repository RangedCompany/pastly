import { renderContent } from "./registry";
import type { ContentFormat } from "./types";
self.onmessage = async (
  event: MessageEvent<{ content: string; format: ContentFormat }>,
) => {
  const { content, format } = event.data;
  self.postMessage(await renderContent({ content }, format));
};

import { parseSavedExportText } from "@/lib/import-posts";
import type { ImportResult } from "@/lib/types";

self.onmessage = (event: MessageEvent) => {
  const data = event.data as ArrayBuffer | string;
  let result: ImportResult;
  try {
    const text = typeof data === "string" ? data : new TextDecoder("utf-8").decode(data);
    result = parseSavedExportText(text);
  } catch {
    result = {
      ok: false,
      error:
        "That file isn’t JSON. Export your information from Instagram, then choose your_instagram_activity/saved/saved_posts.json.",
    };
  }
  self.postMessage(result);
};

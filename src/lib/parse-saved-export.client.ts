"use client";

import { parseSavedExportText } from "@/lib/import-posts";
import type { ImportResult } from "@/lib/types";

const BACKGROUND_PARSE_BYTES = 1_000_000;

export function parseSavedExportOffThread(payload: string | ArrayBuffer): Promise<ImportResult> {
  const size = typeof payload === "string" ? payload.length : payload.byteLength;
  if (typeof payload === "string" && size < BACKGROUND_PARSE_BYTES) {
    return Promise.resolve(parseSavedExportText(payload));
  }

  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./import-posts.worker.ts", import.meta.url));
    } catch {
      resolve(parseOnMainThread(payload));
      return;
    }

    const finish = (result: ImportResult) => {
      worker.terminate();
      resolve(result);
    };

    worker.onmessage = (event: MessageEvent<ImportResult>) => {
      finish(event.data);
    };
    worker.onerror = () => {
      worker.terminate();
      resolve(parseOnMainThread(payload));
    };

    worker.postMessage(payload);
  });
}

function parseOnMainThread(payload: string | ArrayBuffer): ImportResult {
  const text = typeof payload === "string" ? payload : new TextDecoder("utf-8").decode(payload);
  return parseSavedExportText(text);
}

import { isRecord } from "@/lib/guards";
import type { RemoteSuggestion } from "@/lib/library";

export function parseModelContent(content: string): RemoteSuggestion[] {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() || trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    throw new Error("The model didn’t return JSON. Offline groups were left as they are.");
  }

  const list = readList(parsed);
  if (!list) {
    throw new Error("The model response didn’t include a list of groups.");
  }

  return list.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string") return [];
    const category =
      typeof entry.category === "string"
        ? entry.category
        : typeof entry.group === "string"
          ? entry.group
          : "";
    const tags = readTags(entry.tags);
    return [{ id: entry.id, category, tags }];
  });
}

function readList(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) return null;
  if (Array.isArray(parsed.results)) return parsed.results;
  if (Array.isArray(parsed.posts)) return parsed.posts;
  return null;
}

function readTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

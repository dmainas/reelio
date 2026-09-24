import { isRecord } from "@/lib/guards";
import { normalizeMediaType } from "@/lib/media";
import { normalizeTag } from "@/lib/tags";
import type { ImportResult, ImportedDraft } from "@/lib/types";

const MAX_POSTS = 2000;
const MAX_TEXT_LENGTH = 5_000_000;

const NO_POSTS_ERROR =
  "No saved posts were in that file. Reelio looks for saved_saved_media, or a list of posts that include a url.";

export function parseSavedExportText(text: string): ImportResult {
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      error: "That file is too large to import in the browser.",
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "That file is empty. Choose saved_posts.json from your Instagram download.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return {
      ok: false,
      error:
        "That file isn’t JSON. Export your information from Instagram, then choose your_instagram_activity/saved/saved_posts.json.",
    };
  }

  return parseSavedExport(parsed);
}

export function parseSavedExport(input: unknown): ImportResult {
  const records = collectRecords(input);
  if (records.length === 0) {
    return { ok: false, error: NO_POSTS_ERROR };
  }

  const posts: ImportedDraft[] = [];
  let skipped = 0;
  let truncated = false;

  for (const record of records) {
    if (posts.length >= MAX_POSTS) {
      truncated = true;
      break;
    }
    const draft = toDraft(record);
    if (!draft) {
      skipped += 1;
      continue;
    }
    posts.push(draft);
  }

  if (posts.length === 0) {
    return { ok: false, error: NO_POSTS_ERROR };
  }

  return { ok: true, posts, skipped, truncated };
}

function collectRecords(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (!isRecord(input)) return [];

  const keys = ["saved_saved_media", "saved_posts", "posts", "items", "media"] as const;
  for (const key of keys) {
    const value = input[key];
    if (Array.isArray(value)) return value;
  }

  if (typeof input.url === "string" || typeof input.href === "string" || typeof input.link === "string") {
    return [input];
  }

  return [];
}

function toDraft(record: unknown): ImportedDraft | null {
  if (!isRecord(record)) return null;

  const url = extractUrl(record);
  if (!url) return null;

  const instagramShape = isInstagramShape(record);
  const caption = extractCaption(record, instagramShape);
  const account = extractAccount(record, instagramShape);
  const savedAt = extractSavedAt(record);
  const media = normalizeMediaType(
    firstValue(record, ["mediaType", "media_type", "type"]),
    url,
  );
  const tags = extractTags(record);

  return {
    url,
    savedAt,
    caption,
    account,
    mediaType: media.mediaType,
    mediaTypeExplicit: media.explicit,
    tags,
  };
}

function isInstagramShape(record: Record<string, unknown>): boolean {
  return isRecord(record.string_map_data) || Array.isArray(record.string_list_data);
}

function extractUrl(record: Record<string, unknown>): string | null {
  const direct = firstString(record, ["url", "href", "link", "permalink"]);
  if (direct && isHttpUrl(direct)) return direct.trim();

  const mapped = hrefFromMap(record.string_map_data);
  if (mapped) return mapped;

  const listed = hrefFromList(record.string_list_data);
  if (listed) return listed;

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (title && isHttpUrl(title)) return title;

  return null;
}

function hrefFromMap(value: unknown): string | null {
  if (!isRecord(value)) return null;
  for (const entry of Object.values(value)) {
    if (!isRecord(entry)) continue;
    if (typeof entry.href === "string" && isHttpUrl(entry.href)) return entry.href.trim();
    if (typeof entry.url === "string" && isHttpUrl(entry.url)) return entry.url.trim();
  }
  return null;
}

function hrefFromList(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    if (typeof entry.href === "string" && isHttpUrl(entry.href)) return entry.href.trim();
    if (typeof entry.url === "string" && isHttpUrl(entry.url)) return entry.url.trim();
  }
  return null;
}

function extractCaption(record: Record<string, unknown>, instagramShape: boolean): string {
  const explicit = firstString(record, ["caption", "text", "description"]);
  if (explicit) return explicit.trim();

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title || isHttpUrl(title) || looksLikeHandle(title)) return "";
  if (instagramShape) return "";
  return title;
}

function extractAccount(record: Record<string, unknown>, instagramShape: boolean): string {
  const explicit = firstString(record, ["account", "username", "owner", "user", "handle"]);
  if (explicit) return explicit.replace(/^@/, "").trim();

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (instagramShape && looksLikeHandle(title)) return title.replace(/^@/, "");
  return "";
}

function extractSavedAt(record: Record<string, unknown>): string {
  const direct = firstValue(record, ["savedAt", "saved_at", "timestamp", "saved_on"]);
  const directIso = toIso(direct);
  if (directIso) return directIso;

  if (isRecord(record.string_map_data)) {
    for (const entry of Object.values(record.string_map_data)) {
      if (!isRecord(entry)) continue;
      const iso = toIso(entry.timestamp ?? entry.value);
      if (iso) return iso;
    }
  }

  if (Array.isArray(record.string_list_data)) {
    for (const entry of record.string_list_data) {
      if (!isRecord(entry)) continue;
      const iso = toIso(entry.timestamp);
      if (iso) return iso;
    }
  }

  return "";
}

function extractTags(record: Record<string, unknown>): string[] {
  const raw = record.tags ?? record.labels;
  if (!Array.isArray(raw)) return [];
  const tags: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const tag = normalizeTag(entry);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  const value = firstValue(record, keys);
  return typeof value === "string" ? value : "";
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function toIso(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
  }

  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return toIso(Number(trimmed));
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString();
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function looksLikeHandle(value: string): boolean {
  return /^@?[A-Za-z0-9._]{1,30}$/.test(value);
}

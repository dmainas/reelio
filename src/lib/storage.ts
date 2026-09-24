import { isRecord } from "@/lib/guards";
import { defaultSettings, MEDIA_TYPES, type MediaType, type SavedPost, type Settings, type SuggestionStatus } from "@/lib/types";

const STORAGE_KEY = "reelio.library.v1";

const SUGGESTION_STATUSES: SuggestionStatus[] = ["pending", "accepted", "dismissed", "none"];

export type LibrarySnapshot = {
  posts: SavedPost[];
  settings: Settings;
};

export function loadLibrary(): LibrarySnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Reelio couldn’t read the shelf saved in this browser.");
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.posts)) {
    throw new Error("Reelio couldn’t read the shelf saved in this browser.");
  }

  return {
    posts: parsed.posts.flatMap((post) => {
      const sanitized = sanitizePost(post);
      return sanitized ? [sanitized] : [];
    }),
    settings: sanitizeSettings(parsed.settings),
  };
}

export function saveLibrary(snapshot: LibrarySnapshot): void {
  const payload = {
    version: 1,
    posts: snapshot.posts,
    settings: snapshot.settings,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearLibraryStorage(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...defaultSettings };
  return {
    openaiBaseUrl:
      typeof value.openaiBaseUrl === "string" && value.openaiBaseUrl.trim()
        ? value.openaiBaseUrl
        : defaultSettings.openaiBaseUrl,
    openaiApiKey: typeof value.openaiApiKey === "string" ? value.openaiApiKey : "",
    openaiModel:
      typeof value.openaiModel === "string" && value.openaiModel.trim()
        ? value.openaiModel
        : defaultSettings.openaiModel,
  };
}

function sanitizePost(value: unknown): SavedPost | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.url !== "string") return null;

  const mediaType = isMediaType(value.mediaType) ? value.mediaType : "photo";
  const suggestionStatus = isSuggestionStatus(value.suggestionStatus) ? value.suggestionStatus : "none";
  const source = value.source === "import" ? "import" : "demo";

  return {
    id: value.id,
    url: value.url,
    savedAt: typeof value.savedAt === "string" ? value.savedAt : "",
    caption: typeof value.caption === "string" ? value.caption : "",
    account: typeof value.account === "string" ? value.account : "",
    mediaType,
    art: typeof value.art === "string" && value.art ? value.art : "notebook",
    tags: stringList(value.tags),
    aiCategory: typeof value.aiCategory === "string" && value.aiCategory ? value.aiCategory : null,
    aiTags: stringList(value.aiTags),
    suggestionStatus,
    source,
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
}

function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && MEDIA_TYPES.some((mediaType) => mediaType === value);
}

function isSuggestionStatus(value: unknown): value is SuggestionStatus {
  return typeof value === "string" && SUGGESTION_STATUSES.some((status) => status === value);
}

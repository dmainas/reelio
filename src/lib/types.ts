export const MEDIA_TYPES = ["photo", "reel", "carousel", "video"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export type SuggestionStatus = "pending" | "accepted" | "dismissed" | "none";

export type PostSource = "demo" | "import";

export type SavedPost = {
  id: string;
  url: string;
  savedAt: string;
  caption: string;
  account: string;
  mediaType: MediaType;
  art: string;
  tags: string[];
  aiCategory: string | null;
  aiTags: string[];
  suggestionStatus: SuggestionStatus;
  source: PostSource;
};

export type LibraryFilter =
  | { kind: "all" }
  | { kind: "group"; name: string }
  | { kind: "tag"; name: string };

export type Settings = {
  openaiBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
};

export const defaultSettings: Settings = {
  openaiBaseUrl: "https://api.openai.com/v1",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
};

export type ImportedDraft = {
  url: string;
  savedAt: string;
  caption: string;
  account: string;
  mediaType: MediaType;
  mediaTypeExplicit: boolean;
  tags: string[];
};

export type ImportSuccess = {
  ok: true;
  posts: ImportedDraft[];
  skipped: number;
  truncated: boolean;
};

export type ImportFailure = {
  ok: false;
  error: string;
};

export type ImportResult = ImportSuccess | ImportFailure;

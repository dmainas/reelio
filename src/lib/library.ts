import { artForKey, canonicalUrl, idForUrl } from "@/lib/format";
import { mediaLabel } from "@/lib/media";
import { organizeText } from "@/lib/organize";
import { cleanCategory, normalizeTag } from "@/lib/tags";
import type { ImportedDraft, LibraryFilter, SavedPost, SuggestionStatus } from "@/lib/types";

export function groupName(post: SavedPost): string {
  return post.aiCategory ?? "Unsorted";
}

export function postSearchText(post: SavedPost): string {
  return [
    post.caption,
    post.account,
    post.aiCategory ?? "",
    groupName(post),
    post.mediaType,
    mediaLabel(post.mediaType),
    ...post.tags,
    ...post.aiTags,
  ]
    .join("\n")
    .toLowerCase();
}

export function matchesQuery(post: SavedPost, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return postSearchText(post).includes(needle);
}

export function matchesFilter(post: SavedPost, filter: LibraryFilter): boolean {
  switch (filter.kind) {
    case "all":
      return true;
    case "group":
      return groupName(post).toLowerCase() === filter.name.toLowerCase();
    case "tag":
      return post.tags.some((tag) => tag.toLowerCase() === filter.name.toLowerCase());
    default: {
      const neverFilter: never = filter;
      return neverFilter;
    }
  }
}

export function withOfflineSuggestion(
  post: Omit<SavedPost, "aiCategory" | "aiTags" | "suggestionStatus"> & {
    suggestionStatus?: SuggestionStatus;
  },
): SavedPost {
  const organized = organizeText(post.caption, post.account);
  const suggestionStatus: SuggestionStatus =
    post.suggestionStatus ?? (organized.category ? "pending" : "none");
  return {
    ...post,
    aiCategory: organized.category,
    aiTags: organized.tags,
    suggestionStatus,
  };
}

export function acceptSuggestion(post: SavedPost): SavedPost {
  const tags = [...post.tags];
  const add = (value: string | null) => {
    if (!value || tags.includes(value)) return;
    tags.push(value);
  };
  add(post.aiCategory ? normalizeTag(post.aiCategory) : null);
  for (const tag of post.aiTags) add(normalizeTag(tag));
  return { ...post, tags, suggestionStatus: "accepted" };
}

export function dismissSuggestion(post: SavedPost): SavedPost {
  return { ...post, suggestionStatus: "dismissed" };
}

export function refreshOfflineSuggestions(posts: SavedPost[]): SavedPost[] {
  return posts.map((post) => {
    const organized = organizeText(post.caption, post.account);
    const suggestionStatus: SuggestionStatus =
      post.suggestionStatus === "accepted"
        ? "accepted"
        : organized.category
          ? "pending"
          : "none";
    return {
      ...post,
      aiCategory: organized.category,
      aiTags: organized.tags,
      suggestionStatus,
    };
  });
}

export type RemoteSuggestion = {
  id: string;
  category: string;
  tags: string[];
};

export function applyRemoteSuggestions(posts: SavedPost[], results: RemoteSuggestion[]): SavedPost[] {
  const byId = new Map(results.map((result) => [result.id, result]));
  return posts.map((post) => {
    const result = byId.get(post.id);
    if (!result) return post;
    const aiCategory = cleanCategory(result.category);
    const aiTags = result.tags
      .map((tag) => normalizeTag(tag))
      .filter((tag): tag is string => Boolean(tag))
      .slice(0, 3);
    let suggestionStatus = post.suggestionStatus;
    if (suggestionStatus !== "accepted" && suggestionStatus !== "dismissed") {
      suggestionStatus = aiCategory ? "pending" : "none";
    }
    return { ...post, aiCategory, aiTags, suggestionStatus };
  });
}

export function draftToPost(draft: ImportedDraft): SavedPost {
  const organized = organizeText(draft.caption, draft.account);
  return {
    id: idForUrl(draft.url),
    url: draft.url,
    savedAt: draft.savedAt,
    caption: draft.caption,
    account: draft.account,
    mediaType: draft.mediaType,
    art: artForKey(draft.url),
    tags: draft.tags,
    aiCategory: organized.category,
    aiTags: organized.tags,
    suggestionStatus: organized.category ? "pending" : "none",
    source: "import",
  };
}

export function mergeImportedPosts(
  existing: SavedPost[],
  drafts: ImportedDraft[],
): { posts: SavedPost[]; added: number; updated: number } {
  const posts = existing.map((post) => ({ ...post, tags: [...post.tags] }));
  const indexByUrl = new Map<string, number>();
  for (let index = 0; index < posts.length; index += 1) {
    const key = canonicalUrl(posts[index].url);
    if (!indexByUrl.has(key)) indexByUrl.set(key, index);
  }
  const seen = new Set<string>();
  let added = 0;
  let updated = 0;

  for (const draft of drafts) {
    const key = canonicalUrl(draft.url);
    if (seen.has(key)) continue;
    seen.add(key);
    const index = indexByUrl.get(key);
    if (index === undefined) {
      indexByUrl.set(key, posts.length);
      posts.push(draftToPost(draft));
      added += 1;
      continue;
    }
    posts[index] = mergePost(posts[index], draft);
    updated += 1;
  }

  return { posts, added, updated };
}

function mergePost(existing: SavedPost, draft: ImportedDraft): SavedPost {
  const caption = draft.caption || existing.caption;
  const account = draft.account || existing.account;
  const changed = caption !== existing.caption || account !== existing.account;
  const organized = organizeText(caption, account);
  const tags = [...existing.tags];
  for (const tag of draft.tags) {
    if (!tags.includes(tag)) tags.push(tag);
  }

  let suggestionStatus = existing.suggestionStatus;
  if (changed && suggestionStatus !== "accepted") {
    suggestionStatus = organized.category ? "pending" : "none";
  }

  return {
    ...existing,
    caption,
    account,
    url: draft.url || existing.url,
    savedAt: draft.savedAt || existing.savedAt,
    mediaType: draft.mediaTypeExplicit ? draft.mediaType : existing.mediaType,
    tags,
    aiCategory: changed ? organized.category : existing.aiCategory,
    aiTags: changed ? organized.tags : existing.aiTags,
    suggestionStatus,
  };
}

export function addTagToPost(post: SavedPost, raw: string): { post: SavedPost; error: string | null } {
  const tag = normalizeTag(raw);
  if (!tag) {
    return { post, error: "Use a short tag made of letters, numbers, or spaces." };
  }
  if (post.tags.includes(tag)) {
    return { post, error: "That tag is already on this post." };
  }
  return { post: { ...post, tags: [...post.tags, tag] }, error: null };
}

export function removeTagFromPost(post: SavedPost, tag: string): SavedPost {
  return { ...post, tags: post.tags.filter((existing) => existing !== tag) };
}

const MAX_TAG_LENGTH = 32;

export function normalizeTag(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;
  if (cleaned.length > MAX_TAG_LENGTH) return cleaned.slice(0, MAX_TAG_LENGTH).trim();
  return cleaned;
}

export function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function cleanCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "unsorted") return null;
  return titleCase(trimmed).slice(0, 40);
}

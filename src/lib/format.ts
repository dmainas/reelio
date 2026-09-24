const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatSavedDate(iso: string): string {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateFormatter.format(date);
}

export function timeValue(iso: string): number {
  const value = Date.parse(iso);
  return Number.isNaN(value) ? 0 : value;
}

export function shortPath(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    return path || parsed.hostname;
  } catch {
    return url;
  }
}

export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function artForKey(key: string): string {
  const pool = [
    "coast",
    "loaf",
    "river",
    "poster",
    "coat",
    "plant",
    "film",
    "stage",
    "notebook",
    "market",
    "museum",
    "cup",
  ];
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return pool[hash % pool.length] ?? "notebook";
}

export function idForUrl(url: string): string {
  const canonical = canonicalUrl(url);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `saved-${(hash >>> 0).toString(16)}`;
}

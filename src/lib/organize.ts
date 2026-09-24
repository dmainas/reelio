import { cleanCategory, normalizeTag } from "@/lib/tags";

export type OrganizerResult = {
  category: string | null;
  tags: string[];
};

type Topic = {
  category: string;
  keywords: string[];
};

const TOPICS: Topic[] = [
  {
    category: "Travel",
    keywords: ["coast", "ferry", "hike", "flight", "museum", "island", "trail", "layover"],
  },
  {
    category: "Food",
    keywords: ["sourdough", "coffee", "recipe", "restaurant", "brunch", "pasta", "espresso", "scallion"],
  },
  {
    category: "Fitness",
    keywords: ["gym", "deadlift", "workout", "yoga", "run"],
  },
  {
    category: "Design",
    keywords: ["typeface", "layout", "poster", "typography", "palette"],
  },
  {
    category: "Fashion",
    keywords: ["outfit", "wardrobe", "tailor", "coat"],
  },
  {
    category: "Home",
    keywords: ["apartment", "linen", "plant", "interior", "ceramic"],
  },
  {
    category: "Photography",
    keywords: ["film", "portrait", "lens", "camera", "portra"],
  },
  {
    category: "Music",
    keywords: ["concert", "jazz", "vinyl", "playlist"],
  },
  {
    category: "Wellness",
    keywords: ["journal", "meditation", "sleep"],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(haystack: string, keyword: string): boolean {
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(keyword)}[\\p{L}\\p{N}]*`,
    "iu",
  );
  return pattern.test(` ${haystack} `);
}

export function organizeText(caption: string, account: string): OrganizerResult {
  const haystack = `${caption} ${account}`.toLowerCase();
  const scored = TOPICS.map((topic, index) => {
    const hits = topic.keywords.filter((keyword) => hasKeyword(haystack, keyword));
    return { topic, hits, score: hits.length, index };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = scored[0];
  if (!best) return { category: null, tags: [] };

  const tags = best.hits
    .map((hit) => normalizeTag(hit))
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 3);

  return {
    category: cleanCategory(best.topic.category),
    tags,
  };
}

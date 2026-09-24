import assert from "node:assert/strict";
import test from "node:test";

import { createDemoLibrary } from "./demo-posts";
import { canonicalUrl } from "./format";
import { parseSavedExport } from "./import-posts";
import { acceptSuggestion, matchesQuery, mergeImportedPosts } from "./library";
import { parseModelContent } from "./model-response";
import { organizeText } from "./organize";

test("demo library groups captions offline", () => {
  const expected: Record<string, string | null> = {
    "demo-sourdough": "Food",
    "demo-coast": "Travel",
    "demo-coat": "Fashion",
    "demo-coffee": "Food",
    "demo-poster": "Design",
    "demo-run": "Fitness",
    "demo-museum": "Travel",
    "demo-pasta": "Food",
    "demo-hike": "Travel",
    "demo-gym": "Fitness",
    "demo-shirt": "Fashion",
    "demo-plant": "Home",
    "demo-linen": "Home",
    "demo-film": "Photography",
    "demo-jazz": "Music",
    "demo-apartment": "Home",
    "demo-journal": "Wellness",
    "demo-market": "Food",
    "demo-later": null,
  };

  const posts = createDemoLibrary();
  assert.equal(posts.length, Object.keys(expected).length);
  for (const post of posts) {
    assert.equal(post.aiCategory, expected[post.id], post.id);
    if (post.aiCategory) {
      assert.equal(post.suggestionStatus, "pending");
      assert.ok(post.aiTags.length > 0);
    } else {
      assert.equal(post.suggestionStatus, "none");
    }
  }
});

test("search matches captions, accounts, tags, and categories", () => {
  const posts = createDemoLibrary();
  const sourdough = posts.find((post) => post.id === "demo-sourdough");
  assert.ok(sourdough);
  assert.equal(matchesQuery(sourdough, "sourdough"), true);
  assert.equal(matchesQuery(sourdough, "weekdayoven"), true);
  assert.equal(matchesQuery(sourdough, "baking"), true);
  assert.equal(matchesQuery(sourdough, "food"), true);
  assert.equal(matchesQuery(sourdough, "zzzz-no-match"), false);
});

test("accepting a suggestion adds the group and keywords as tags", () => {
  const post = createDemoLibrary().find((entry) => entry.id === "demo-sourdough");
  assert.ok(post);
  const accepted = acceptSuggestion(post);
  assert.equal(accepted.suggestionStatus, "accepted");
  assert.ok(accepted.tags.includes("baking"));
  assert.ok(accepted.tags.includes("food"));
  assert.ok(accepted.tags.includes("sourdough"));
});

test("parses Instagram saved_saved_media with a url and timestamp", () => {
  const result = parseSavedExport({
    saved_saved_media: [
      {
        title: "",
        string_map_data: {
          "Saved on": {
            href: "https://www.instagram.com/p/AbC123/",
            timestamp: 1714521600,
          },
        },
      },
      {
        title: "saltandlatitude",
        string_list_data: [
          {
            href: "https://www.instagram.com/reel/XyZ789/",
            timestamp: 1710000000,
          },
        ],
      },
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts.length, 2);
  assert.equal(result.posts[0]?.caption, "");
  assert.equal(result.posts[0]?.savedAt, "2024-05-01T00:00:00.000Z");
  assert.equal(result.posts[0]?.mediaType, "photo");
  assert.equal(result.posts[1]?.account, "saltandlatitude");
  assert.equal(result.posts[1]?.mediaType, "reel");
});

test("parses richer post JSON and skips entries without a link", () => {
  const result = parseSavedExport({
    posts: [
      {
        url: "https://www.instagram.com/p/RichOne/",
        caption: "A rainy coast walk",
        account: "@northshore",
        mediaType: "carousel",
        savedAt: "2024-06-01T12:00:00.000Z",
        tags: ["Weekend", "weekend"],
      },
      { caption: "missing a link" },
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts.length, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.posts[0]?.account, "northshore");
  assert.equal(result.posts[0]?.mediaType, "carousel");
  assert.equal(result.posts[0]?.mediaTypeExplicit, true);
  assert.deepEqual(result.posts[0]?.tags, ["weekend"]);
});

test("rejects JSON that is not a saved-post export", () => {
  const result = parseSavedExport({ nope: true });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /No saved posts/);
});

test("import merges by url and keeps tags already on the shelf", () => {
  const existing = createDemoLibrary().slice(0, 1);
  const first = existing[0];
  assert.ok(first);
  const merged = mergeImportedPosts(existing, [
    {
      url: `${first.url}?igsh=1`,
      savedAt: first.savedAt,
      caption: "A new sourdough caption about the weekend loaf",
      account: first.account,
      mediaType: "photo",
      mediaTypeExplicit: false,
      tags: ["weekend"],
    },
  ]);
  assert.equal(merged.added, 0);
  assert.equal(merged.updated, 1);
  assert.equal(canonicalUrl(first.url), canonicalUrl(`${first.url}?igsh=1`));
  assert.ok(merged.posts[0]?.tags.includes("baking"));
  assert.ok(merged.posts[0]?.tags.includes("weekend"));
  assert.match(merged.posts[0]?.caption ?? "", /weekend loaf/);
});

test("organizer leaves bland captions unsorted", () => {
  assert.deepEqual(organizeText("Saving this for later.", "inbox"), {
    category: null,
    tags: [],
  });
});

test("parses fenced model JSON", () => {
  const results = parseModelContent(
    '```json\n{"results":[{"id":"demo-coast","category":"Travel","tags":["coast","ferry"]}]}\n```',
  );
  assert.equal(results.length, 1);
  assert.equal(results[0]?.category, "Travel");
  assert.deepEqual(results[0]?.tags, ["coast", "ferry"]);
});

import assert from "node:assert/strict";
import test from "node:test";

import { parseSavedExport, parseSavedExportText } from "./import-posts";

test("parses a current Instagram download that uses label_values", () => {
  const result = parseSavedExport([
    {
      timestamp: 1714521600,
      media: [],
      label_values: [
        {
          label: "URL",
          value: "https://www.instagram.com/reel/AbC123/",
          href: "https://www.instagram.com/reel/AbC123/",
        },
        { label: "Didascalia", value: "Rain on the coast road" },
        { label: "Titolo", value: "" },
        {
          title: "Titolare",
          dict: [
            {
              title: "",
              dict: [
                { label: "URL", value: "https://www.instagram.com/northshore/" },
                { label: "Nome", value: "North Shore" },
                { label: "Nome utente", value: "northshore" },
              ],
            },
          ],
        },
      ],
    },
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0]?.url, "https://www.instagram.com/reel/AbC123/");
  assert.equal(result.posts[0]?.caption, "Rain on the coast road");
  assert.equal(result.posts[0]?.account, "northshore");
  assert.equal(result.posts[0]?.mediaType, "reel");
  assert.equal(result.posts[0]?.savedAt, "2024-05-01T00:00:00.000Z");
});

test("parses English username and caption labels", () => {
  const result = parseSavedExport([
    {
      timestamp: 1710000000,
      label_values: [
        { label: "Caption", value: "A short note" },
        {
          title: "Owner",
          dict: [{ label: "Username", value: "weekdayoven" }],
        },
        { label: "URL", href: "https://www.instagram.com/p/RichOne/" },
      ],
    },
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts[0]?.caption, "A short note");
  assert.equal(result.posts[0]?.account, "weekdayoven");
});

test("accepts an Instagram export larger than 5MB", () => {
  const text = JSON.stringify({
    saved_saved_media: [
      {
        string_map_data: {
          "Saved on": {
            href: "https://www.instagram.com/p/AbC123/",
            timestamp: 1714521600,
            note: "a".repeat(5_000_000),
          },
        },
      },
    ],
  });
  assert.ok(text.length > 5_000_000);
  const result = parseSavedExportText(text);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0]?.url, "https://www.instagram.com/p/AbC123/");
});

test("imports every saved post instead of stopping at 2000", () => {
  const records = Array.from({ length: 2500 }, (_, index) => ({
    url: `https://www.instagram.com/p/post${index}/`,
    caption: "note",
  }));
  const result = parseSavedExport(records);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.posts.length, 2500);
});

test("rejects invalid JSON with a clear error", () => {
  const result = parseSavedExportText("{");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /isn’t JSON/);
});

test("rejects JSON that is not an Instagram export", () => {
  const result = parseSavedExportText('{"profile":{"name":"Ada"}}');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /No saved posts/);
});

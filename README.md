# Reelio

Reelio is a private shelf for saved Instagram posts. It suggests groups and tags from captions, lets you add and remove your own tags, and searches captions, accounts, tags, and those groups. Everything stays in this browser. There is no account, no database, and no Instagram login.

A demo library is loaded the first time you open the app, so search and tagging work with zero API keys. Grouping runs offline from keywords in the caption. An OpenAI-compatible key in Settings is optional; the shelf still works if you never add one.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on [http://127.0.0.1:43117](http://127.0.0.1:43117).

```bash
npm test
npm run lint
```

## Import an Instagram export

In Instagram: Settings → Accounts Center → Your information and permissions → Download your information. From the download, choose:

`your_instagram_activity/saved/saved_posts.json`

That file is often only a URL and a timestamp under `saved_saved_media`. Reelio accepts that shape, including `string_map_data` and `string_list_data`.

A richer file also works when you have captions, accounts, and media type:

```json
{
  "posts": [
    {
      "url": "https://www.instagram.com/p/example/",
      "savedAt": "2024-08-12T18:30:00.000Z",
      "caption": "A windy coast walk after the ferry.",
      "account": "northshore",
      "mediaType": "carousel",
      "tags": ["weekend"]
    }
  ]
}
```

Examples live in `public/examples/`. Import them from the Import dialog, or paste JSON. Posts are matched by URL, so importing again updates captions without wiping tags you already added.

Stand-in images are local files in `public/placeholders/`. Reelio does not load Instagram CDN images, and it does not talk to private Instagram APIs.

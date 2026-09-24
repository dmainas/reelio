"use client";

import { FilterPanel } from "@/components/filter-panel";
import { ImportDialog } from "@/components/import-dialog";
import { PostCard } from "@/components/post-card";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createDemoLibrary } from "@/lib/demo-posts";
import { timeValue } from "@/lib/format";
import {
  acceptSuggestion,
  addTagToPost,
  applyRemoteSuggestions,
  dismissSuggestion,
  matchesFilter,
  matchesQuery,
  mergeImportedPosts,
  refreshOfflineSuggestions,
  removeTagFromPost,
} from "@/lib/library";
import { requestRemoteOrganize } from "@/lib/remote-organize";
import { clearLibraryStorage, loadLibrary, saveLibrary } from "@/lib/storage";
import { defaultSettings, type ImportedDraft, type LibraryFilter, type SavedPost, type Settings } from "@/lib/types";
import { BookmarkIcon, SearchIcon, SettingsIcon, SlidersHorizontalIcon, UploadIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready" };

export function LibraryApp() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>({ kind: "all" });
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // Read localStorage after paint so the server and the first client render
    // both show the loading shelf, then the saved library replaces it.
    const timer = window.setTimeout(() => {
      try {
        const stored = loadLibrary();
        if (!stored) {
          const demo = createDemoLibrary();
          setPosts(demo);
          setSettings(defaultSettings);
          saveLibrary({ posts: demo, settings: defaultSettings });
        } else {
          setPosts(stored.posts);
          setSettings(stored.settings);
        }
        setLoadState({ status: "ready" });
      } catch {
        setLoadState({ status: "error" });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function commit(nextPosts: SavedPost[], nextSettings: Settings = settings) {
    setPosts(nextPosts);
    setSettings(nextSettings);
    try {
      saveLibrary({ posts: nextPosts, settings: nextSettings });
    } catch {
      toast.error("Couldn’t save the shelf in this browser. Storage may be full or blocked.");
    }
  }

  const visible = useMemo(() => {
    return posts
      .filter((post) => matchesQuery(post, query) && matchesFilter(post, filter))
      .sort((a, b) => timeValue(b.savedAt) - timeValue(a.savedAt));
  }, [posts, query, filter]);

  function updatePost(postId: string, map: (post: SavedPost) => SavedPost) {
    commit(posts.map((post) => (post.id === postId ? map(post) : post)));
  }

  function onAddTag(postId: string, raw: string): string | null {
    const current = posts.find((post) => post.id === postId);
    if (!current) return "That post is no longer on the shelf.";
    const result = addTagToPost(current, raw);
    if (result.error) return result.error;
    updatePost(postId, () => result.post);
    return null;
  }

  function onRemoveTag(postId: string, tag: string) {
    const nextPosts = posts.map((post) => (post.id === postId ? removeTagFromPost(post, tag) : post));
    commit(nextPosts);
    if (filter.kind === "tag" && filter.name === tag && !nextPosts.some((post) => post.tags.includes(tag))) {
      setFilter({ kind: "all" });
    }
  }

  function onImport(drafts: ImportedDraft[], meta: { skipped: number; truncated: boolean }) {
    const merged = mergeImportedPosts(posts, drafts);
    commit(merged.posts);
    toast.success(importSummary(merged.added, merged.updated, meta.skipped, meta.truncated));
  }

  function restoreDemo() {
    commit(createDemoLibrary());
    setQuery("");
    setFilter({ kind: "all" });
    setSettingsOpen(false);
    toast.success("Demo library restored.");
  }

  function clearShelf() {
    commit([]);
    setQuery("");
    setFilter({ kind: "all" });
    setSettingsOpen(false);
    toast.success("Shelf cleared on this browser.");
  }

  function startOver() {
    try {
      clearLibraryStorage();
    } catch {
      // Storage may already be unavailable; the demo still loads in memory.
    }
    const demo = createDemoLibrary();
    setPosts(demo);
    setSettings(defaultSettings);
    setQuery("");
    setFilter({ kind: "all" });
    try {
      saveLibrary({ posts: demo, settings: defaultSettings });
    } catch {
      toast.error("The demo is loaded, but this browser is not storing it.");
    }
    setLoadState({ status: "ready" });
  }

  const summary = summaryText(posts.length, visible.length, filter, query);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookmarkIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg leading-none font-semibold tracking-tight">Reelio</h1>
                <p className="mt-1 hidden truncate text-xs text-muted-foreground sm:block">
                  Saved posts, grouped on this device.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" data-testid="open-import" onClick={() => setImportOpen(true)}>
                <UploadIcon />
                Import
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Settings"
                data-testid="open-settings"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="md:hidden"
              data-testid="open-filters"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontalIcon />
              Filters
            </Button>
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-testid="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search captions, accounts, tags, or groups"
                aria-label="Search captions, accounts, tags, or groups"
                className="pr-8 pl-8"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  data-testid="clear-search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setQuery("")}
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-5 sm:px-6">
        <aside className="sticky top-28 hidden h-fit w-60 shrink-0 md:block">
          {loadState.status === "ready" ? (
            <FilterPanel posts={posts} filter={filter} onFilter={setFilter} />
          ) : null}
        </aside>
        <main className="min-w-0 flex-1" aria-busy={loadState.status === "loading"}>
          {loadState.status === "loading" ? <LoadingShelf /> : null}
          {loadState.status === "error" ? <ErrorShelf onStartOver={startOver} /> : null}
          {loadState.status === "ready" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p data-testid="result-summary" className="text-sm text-muted-foreground">
                  {summary}
                </p>
                {filter.kind !== "all" ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFilter({ kind: "all" })}>
                    Clear filter
                  </Button>
                ) : null}
              </div>
              {posts.length === 0 ? (
                <EmptyShelf onImport={() => setImportOpen(true)} onRestore={restoreDemo} />
              ) : visible.length === 0 ? (
                <NoMatches query={query} onClear={() => { setQuery(""); setFilter({ kind: "all" }); }} />
              ) : (
                <div data-testid="post-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onAddTag={onAddTag}
                      onRemoveTag={onRemoveTag}
                      onFilterTag={(tag) => setFilter({ kind: "tag", name: tag })}
                      onSearchAccount={(account) => setQuery(account)}
                      onAcceptSuggestion={(postId) => {
                        updatePost(postId, acceptSuggestion);
                        toast.success("Suggestion added to your tags.");
                      }}
                      onDismissSuggestion={(postId) => updatePost(postId, dismissSuggestion)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        Stored in this browser. Captions leave the device only if you choose a model in settings.
      </footer>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter the shelf</SheetTitle>
            <SheetDescription>Groups come from captions. Tags are the ones you add.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FilterPanel
              posts={posts}
              filter={filter}
              onFilter={(next) => {
                setFilter(next);
                setFiltersOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={onImport} />
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onOpenChange={setSettingsOpen}
        onChange={(next) => commit(posts, next)}
        onRefreshOffline={() => {
          commit(refreshOfflineSuggestions(posts));
          toast.success("Offline suggestions refreshed.");
        }}
        onOrganizeRemote={async () => {
          const results = await requestRemoteOrganize(settings, posts);
          commit(applyRemoteSuggestions(posts, results));
          toast.success("Model suggestions are ready to accept.");
        }}
        onRestoreDemo={restoreDemo}
        onClearShelf={clearShelf}
      />
    </div>
  );
}

function summaryText(total: number, shown: number, filter: LibraryFilter, query: string): string {
  const scope = filterPhrase(filter);
  const noun = shown === 1 ? "post" : "posts";
  if (!query.trim() && filter.kind === "all") {
    return `${total} saved ${total === 1 ? "post" : "posts"}`;
  }
  return `${shown} ${noun} ${scope}${query.trim() ? ` matching “${query.trim()}”` : ""}`;
}

function filterPhrase(filter: LibraryFilter): string {
  switch (filter.kind) {
    case "all":
      return "on the shelf";
    case "group":
      return `in ${filter.name}`;
    case "tag":
      return `tagged ${filter.name}`;
    default: {
      const neverFilter: never = filter;
      return neverFilter;
    }
  }
}

function importSummary(added: number, updated: number, skipped: number, truncated: boolean): string {
  const parts: string[] = [];
  if (added > 0) parts.push(`${added} new`);
  if (updated > 0) parts.push(`${updated} updated`);
  let message = parts.length > 0 ? `Imported ${parts.join(" and ")}.` : "Those posts were already on the shelf.";
  if (skipped > 0) {
    message += ` ${skipped} ${skipped === 1 ? "entry was" : "entries were"} skipped because there was no link.`;
  }
  if (truncated) message += " Only the first 2,000 posts were imported.";
  return message;
}

function LoadingShelf() {
  return (
    <div data-testid="library-loading" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {["one", "two", "three", "four", "five", "six"].map((key) => (
        <div key={key} className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <div className="h-44 animate-pulse bg-muted sm:h-48" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorShelf({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div
      data-testid="library-error"
      role="alert"
      className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-xl bg-card px-5 py-6 ring-1 ring-foreground/10"
    >
      <h2 className="text-lg font-semibold">The shelf in this browser couldn’t be read.</h2>
      <p className="text-sm text-muted-foreground">
        The saved data is missing or damaged. Starting over loads the demo library so you can keep organizing.
      </p>
      <Button type="button" onClick={onStartOver}>
        Start over with the demo
      </Button>
    </div>
  );
}

function EmptyShelf({ onImport, onRestore }: { onImport: () => void; onRestore: () => void }) {
  return (
    <div
      data-testid="empty-shelf"
      className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-xl bg-card px-5 py-6 ring-1 ring-foreground/10"
    >
      <h2 className="text-lg font-semibold">Nothing on the shelf yet.</h2>
      <p className="text-sm text-muted-foreground">
        Load the demo library to try groups, tags, and search, or import saved posts from an Instagram download.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onRestore}>
          Load demo library
        </Button>
        <Button type="button" variant="outline" onClick={onImport}>
          Import
        </Button>
      </div>
    </div>
  );
}

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  const trimmed = query.trim();
  return (
    <div
      data-testid="no-matches"
      className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-xl bg-card px-5 py-6 ring-1 ring-foreground/10"
    >
      <h2 className="text-lg font-semibold">
        {trimmed ? `No posts match “${trimmed}”.` : "No posts in this filter."}
      </h2>
      <p className="text-sm text-muted-foreground">
        Search looks through captions, accounts, your tags, and suggested groups.
      </p>
      <Button type="button" variant="outline" onClick={onClear}>
        Clear search and filters
      </Button>
    </div>
  );
}

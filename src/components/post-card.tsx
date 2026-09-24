"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSavedDate, shortPath } from "@/lib/format";
import { mediaLabel } from "@/lib/media";
import type { SavedPost } from "@/lib/types";
import { SparklesIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type PostCardProps = {
  post: SavedPost;
  onAddTag: (postId: string, raw: string) => string | null;
  onRemoveTag: (postId: string, tag: string) => void;
  onFilterTag: (tag: string) => void;
  onSearchAccount: (account: string) => void;
  onAcceptSuggestion: (postId: string) => void;
  onDismissSuggestion: (postId: string) => void;
};

export function PostCard({
  post,
  onAddTag,
  onRemoveTag,
  onFilterTag,
  onSearchAccount,
  onAcceptSuggestion,
  onDismissSuggestion,
}: PostCardProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const accountLabel = post.account ? `@${post.account}` : "Unknown account";
  const showSuggestion = post.suggestionStatus === "pending" && Boolean(post.aiCategory);

  return (
    <article
      data-testid="post-card"
      data-post-id={post.id}
      className="flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 [contain-intrinsic-size:auto_28rem] [content-visibility:auto]"
    >
      <div className="relative">
        <Image
          src={`/placeholders/${post.art}.svg`}
          alt={
            post.account
              ? `Stand-in image for a saved post by @${post.account}`
              : "Stand-in image for a saved post"
          }
          width={800}
          height={640}
          unoptimized
          className="h-44 w-full object-cover sm:h-48"
        />
        <Badge variant="secondary" className="absolute top-2 left-2 bg-background/90">
          {mediaLabel(post.mediaType)}
        </Badge>
        <Badge variant="outline" className="absolute top-2 right-2 bg-background/90">
          {post.source === "demo" ? "Demo" : "Imported"}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-3">
          {post.account ? (
            <button
              type="button"
              className="truncate text-sm font-medium hover:underline"
              onClick={() => onSearchAccount(post.account)}
            >
              {accountLabel}
            </button>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">{accountLabel}</p>
          )}
          <time dateTime={post.savedAt || undefined} className="shrink-0 text-xs text-muted-foreground">
            {formatSavedDate(post.savedAt)}
          </time>
        </div>
        <p className="text-sm leading-5 text-foreground/90">
          {post.caption || "No caption in this export. Reelio only has the link and the time it was saved."}
        </p>
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {shortPath(post.url)}
        </a>
        <div className="flex flex-wrap gap-1.5">
          {post.tags.length === 0 ? (
            <span className="text-xs text-muted-foreground">No tags yet</span>
          ) : (
            post.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-secondary text-xs">
                <button type="button" className="px-2 py-1" onClick={() => onFilterTag(tag)}>
                  {tag}
                </button>
                <button
                  type="button"
                  data-testid="remove-tag"
                  data-tag={tag}
                  aria-label={`Remove tag ${tag}`}
                  className="pr-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => onRemoveTag(post.id, tag)}
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <form
          data-testid="add-tag-form"
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            const nextError = onAddTag(post.id, draft);
            setError(nextError);
            if (!nextError) setDraft("");
          }}
        >
          <Input
            data-testid="add-tag-input"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Add a tag"
            aria-label={`Add a tag for ${accountLabel}`}
          />
          <Button type="submit" variant="outline" size="sm" data-testid="add-tag-submit">
            Add
          </Button>
        </form>
        {error ? (
          <p className="text-xs text-destructive" role="alert" data-testid="tag-error">
            {error}
          </p>
        ) : null}
        {showSuggestion ? (
          <div
            data-testid="ai-suggestion"
            className="mt-auto rounded-lg bg-amber-50 px-2.5 py-2 ring-1 ring-amber-200/80"
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-950">
              <SparklesIcon className="size-3.5" />
              Suggested group · {post.aiCategory}
            </p>
            {post.aiTags.length > 0 ? (
              <p className="mt-1 text-xs text-amber-900">Also tag {post.aiTags.join(", ")}</p>
            ) : null}
            <div className="mt-2 flex gap-1.5">
              <Button
                type="button"
                size="xs"
                data-testid="accept-suggestion"
                onClick={() => onAcceptSuggestion(post.id)}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                data-testid="dismiss-suggestion"
                onClick={() => onDismissSuggestion(post.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

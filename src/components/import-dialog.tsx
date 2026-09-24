"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseSavedExportText } from "@/lib/import-posts";
import type { ImportedDraft } from "@/lib/types";
import { useState } from "react";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (drafts: ImportedDraft[], meta: { skipped: number; truncated: boolean }) => void;
};

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  function resetDraft() {
    setPaste("");
    setFileName("");
    setFileText(null);
    setError(null);
    setReading(false);
  }

  async function onFileChange(file: File | undefined) {
    setError(null);
    if (!file) {
      setFileName("");
      setFileText(null);
      return;
    }
    setReading(true);
    setFileName(file.name);
    try {
      setFileText(await file.text());
    } catch {
      setFileText(null);
      setError("Couldn’t read that file. Try again, or paste the JSON below.");
    } finally {
      setReading(false);
    }
  }

  function importText(text: string) {
    const result = parseSavedExportText(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.posts, { skipped: result.skipped, truncated: result.truncated });
    resetDraft();
    onOpenChange(false);
  }

  async function importSample() {
    setError(null);
    setReading(true);
    try {
      const response = await fetch("/examples/instagram-saved-posts.json");
      if (!response.ok) {
        setError("The sample export couldn’t be loaded.");
        return;
      }
      importText(await response.text());
    } catch {
      setError("The sample export couldn’t be loaded.");
    } finally {
      setReading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetDraft();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import saved posts</DialogTitle>
          <DialogDescription>
            Instagram’s download includes{" "}
            <span className="font-mono text-xs">your_instagram_activity/saved/saved_posts.json</span>.
            Those entries are often just a link and the time you saved them. A richer JSON file with
            captions, accounts, and media type works too.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            JSON file
            <input
              data-testid="import-file"
              type="file"
              accept="application/json,.json"
              className="block w-full text-sm font-normal text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-foreground"
              onChange={(event) => {
                void onFileChange(event.target.files?.[0]);
              }}
            />
          </label>
          {fileName ? <p className="text-xs text-muted-foreground">Selected {fileName}</p> : null}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Or paste JSON
            <Textarea
              data-testid="import-paste"
              value={paste}
              onChange={(event) => {
                setPaste(event.target.value);
                if (error) setError(null);
              }}
              placeholder='{"saved_saved_media":[{"string_map_data":{"Saved on":{"href":"https://www.instagram.com/p/…","timestamp":1714521600}}}]}'
              className="min-h-28 font-mono text-xs"
            />
          </label>
          {error ? (
            <div
              role="alert"
              data-testid="import-error"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing is uploaded. Parsing happens in this browser.{" "}
              <a className="underline underline-offset-2" href="/examples/rich-saved-posts.json" download>
                Download a richer example
              </a>
              .
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={reading} onClick={() => void importSample()}>
            Import sample export
          </Button>
          <Button
            type="button"
            data-testid="import-submit"
            disabled={reading}
            onClick={() => {
              const text = fileText ?? paste;
              if (!text.trim()) {
                setError("Choose a JSON file or paste the export.");
                return;
              }
              importText(text);
            }}
          >
            {reading ? "Reading…" : "Import posts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

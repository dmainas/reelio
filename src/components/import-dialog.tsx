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
import { parseSavedExportOffThread } from "@/lib/parse-saved-export.client";
import type { ImportedDraft } from "@/lib/types";
import { useState } from "react";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (drafts: ImportedDraft[], meta: { skipped: number }) => void;
};

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  function resetDraft() {
    setPaste("");
    setFileName("");
    setFile(null);
    setError(null);
    setReading(false);
  }

  function onFileChange(next: File | undefined) {
    setError(null);
    setReading(false);
    if (!next) {
      setFileName("");
      setFile(null);
      return;
    }
    setFileName(next.name);
    setFile(next);
  }

  async function importPayload(payload: string | ArrayBuffer) {
    setReading(true);
    setError(null);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    try {
      const result = await parseSavedExportOffThread(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onImport(result.posts, { skipped: result.skipped });
      resetDraft();
      onOpenChange(false);
    } catch {
      setError("Couldn’t read that file. Try again, or paste the JSON below.");
    } finally {
      setReading(false);
    }
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
      await importPayload(await response.text());
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
      <DialogContent
        data-testid="import-dialog"
        className="flex max-h-[calc(100dvh-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 px-4 pt-4 pr-12">
          <DialogTitle>Import saved posts</DialogTitle>
          <DialogDescription className="text-pretty">
            Instagram’s download includes{" "}
            <span className="font-mono text-xs break-all">your_instagram_activity/saved/saved_posts.json</span>.
            Those entries are often just a link and the time you saved them. A richer JSON file with
            captions, accounts, and media type works too.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 min-w-0 flex-auto flex-col gap-3 overflow-y-auto px-4 py-3">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            JSON file
            <input
              data-testid="import-file"
              type="file"
              accept="application/json,.json"
              className="block w-full max-w-full min-w-0 text-sm font-normal text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-foreground"
              onChange={(event) => {
                onFileChange(event.target.files?.[0]);
              }}
            />
          </label>
          {fileName ? (
            <p className="text-xs break-all text-muted-foreground">Selected {fileName}</p>
          ) : null}
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Or paste JSON
            <Textarea
              data-testid="import-paste"
              value={paste}
              onChange={(event) => {
                setPaste(event.target.value);
                if (error) setError(null);
              }}
              placeholder='{"saved_saved_media":[{"string_map_data":{"Saved on":{"href":"https://www.instagram.com/p/…","timestamp":1714521600}}}]}'
              className="field-sizing-fixed max-h-36 min-h-28 w-full min-w-0 font-mono text-xs break-all"
            />
          </label>
          {error ? (
            <div
              role="alert"
              data-testid="import-error"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm break-words text-destructive"
            >
              {error}
            </div>
          ) : (
            <p className="text-xs text-pretty text-muted-foreground">
              Nothing is uploaded. Parsing happens in this browser.{" "}
              <a className="underline underline-offset-2" href="/examples/rich-saved-posts.json" download>
                Download a richer example
              </a>
              .
            </p>
          )}
        </div>
        {reading ? (
          <p data-testid="import-status" className="shrink-0 px-4 pb-2 text-sm text-muted-foreground">
            Parsing this export…
          </p>
        ) : null}
        <DialogFooter className="mx-0 mb-0 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="max-w-full whitespace-normal"
            disabled={reading}
            onClick={() => void importSample()}
          >
            Import sample export
          </Button>
          <Button
            type="button"
            className="max-w-full whitespace-normal"
            data-testid="import-submit"
            disabled={reading}
            onClick={() => {
              void (async () => {
                if (file) {
                  setReading(true);
                  try {
                    await importPayload(await file.arrayBuffer());
                  } catch {
                    setError("Couldn’t read that file. Try again, or paste the JSON below.");
                    setReading(false);
                  }
                  return;
                }
                if (!paste.trim()) {
                  setError("Choose a JSON file or paste the export.");
                  return;
                }
                await importPayload(paste);
              })();
            }}
          >
            {reading ? "Importing…" : "Import posts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/lib/types";
import { useState } from "react";

type SettingsDialogProps = {
  open: boolean;
  settings: Settings;
  onOpenChange: (open: boolean) => void;
  onChange: (settings: Settings) => void;
  onRefreshOffline: () => void;
  onOrganizeRemote: () => Promise<void>;
  onRestoreDemo: () => void;
  onClearShelf: () => void;
};

export function SettingsDialog({
  open,
  settings,
  onOpenChange,
  onChange,
  onRefreshOffline,
  onOrganizeRemote,
  onRestoreDemo,
  onClearShelf,
}: SettingsDialogProps) {
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remotePending, setRemotePending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const hasKey = settings.openaiApiKey.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setRemoteError(null);
          setConfirmClear(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Groups and tags are suggested on this device from words in the caption. Reelio works fully
            without an API key.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
            <p className="text-sm font-medium">Offline organizer</p>
            <p className="text-xs text-muted-foreground">
              Refresh suggestions if you changed captions by importing a richer file. Accepted tags stay
              put.
            </p>
            <Button type="button" variant="outline" onClick={onRefreshOffline}>
              Refresh offline suggestions
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Optional model</p>
            <p className="text-xs text-muted-foreground">
              An OpenAI-compatible endpoint can regroup captions when you ask. The key stays in this
              browser and is sent only to your local Reelio server for that request.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="openai-base-url">Base URL</Label>
              <Input
                id="openai-base-url"
                value={settings.openaiBaseUrl}
                onChange={(event) => onChange({ ...settings, openaiBaseUrl: event.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="openai-model">Model</Label>
              <Input
                id="openai-model"
                value={settings.openaiModel}
                onChange={(event) => onChange({ ...settings, openaiModel: event.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="openai-api-key">API key</Label>
              <Input
                id="openai-api-key"
                type="password"
                value={settings.openaiApiKey}
                placeholder="Not required"
                onChange={(event) => onChange({ ...settings, openaiApiKey: event.target.value })}
                autoComplete="off"
              />
            </div>
            {remoteError ? (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {remoteError}
              </div>
            ) : null}
            <Button
              type="button"
              disabled={!hasKey || remotePending}
              onClick={() => {
                setRemoteError(null);
                setRemotePending(true);
                void onOrganizeRemote()
                  .catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : "The model organizer failed.";
                    setRemoteError(message);
                  })
                  .finally(() => setRemotePending(false));
              }}
            >
              {remotePending ? "Asking the model…" : "Organize with this model"}
            </Button>
            {!hasKey ? (
              <p className="text-xs text-muted-foreground">
                Add a key to enable the model. The shelf, search, and offline groups keep working either
                way.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 border-t pt-3">
            <Button type="button" variant="outline" data-testid="restore-demo" onClick={onRestoreDemo}>
              Restore demo library
            </Button>
            {confirmClear ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm">Clear every post from this browser?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" onClick={() => { setConfirmClear(false); onClearShelf(); }}>
                    Clear shelf
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setConfirmClear(false)}>
                    Keep posts
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmClear(true)}>
                Clear shelf
              </Button>
            )}
          </div>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

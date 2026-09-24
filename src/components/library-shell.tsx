"use client";

import dynamic from "next/dynamic";

const LibraryApp = dynamic(
  () => import("@/components/library-app").then((mod) => mod.LibraryApp),
  {
    ssr: false,
    loading: () => <LoadingShelf />,
  },
);

export function LibraryShell() {
  return <LibraryApp />;
}

function LoadingShelf() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
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
    </div>
  );
}

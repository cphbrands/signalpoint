"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: any; reset: () => void }) {
  useEffect(() => {
    console.error("[Admin Campaigns Error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The campaigns page crashed in the browser. This screen prevents a blank page and logs the real error in the console.
      </p>

      <div className="mt-4 rounded-md border bg-card p-3 text-sm">
        <div className="font-medium">Error</div>
        <pre className="mt-2 whitespace-pre-wrap break-words opacity-80">
          {String(error?.message || error)}
        </pre>
      </div>

      <button
        onClick={() => reset()}
        className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

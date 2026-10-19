"use client";

import { ErrorState } from "@/components/States";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message={error.message || "An unexpected error occurred."}
      action={
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
      }
    />
  );
}

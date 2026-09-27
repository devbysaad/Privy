"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <h1 className="font-heading text-xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}

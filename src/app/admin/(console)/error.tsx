"use client";

export default function AdminConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card-surface p-8 text-center">
      <h2 className="text-lg font-semibold">That action couldn&apos;t be completed</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Something went wrong. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

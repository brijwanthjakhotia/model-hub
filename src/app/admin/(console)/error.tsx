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
        {/* Next redacts server-action error messages in production, so we don't
            surface `error.message` here (it would be a generic string in prod
            anyway). Expected, user-recoverable cases are prevented up-front in
            the UI or returned as form state instead of thrown. */}
        Something went wrong, or the item changed while you were working. Please
        refresh and try again.
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

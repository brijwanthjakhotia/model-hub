/** Route-level loading UI shown during navigation to any page that suspends on
 *  its server data (the persistent header/footer from the layout stay put). */
export default function Loading() {
  return (
    <div
      className="container flex min-h-[60vh] items-center justify-center py-16"
      role="status"
      aria-label="Loading"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  );
}

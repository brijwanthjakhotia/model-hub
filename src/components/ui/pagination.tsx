import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Offset pagination controls. Renders nothing for a single page. Builds hrefs
 * on `basePath`, preserving `params` (e.g. active gallery filters) and setting
 * `page` (omitted for page 1 so the canonical first-page URL has no ?page=1).
 */
export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  params = {},
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  params?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(1, page), totalPages);

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Windowed page numbers around the current page (max 5).
  const start = Math.max(1, Math.min(current - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const linkBase =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-ring";

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      {current > 1 ? (
        <Link href={href(current - 1)} className={linkBase} rel="prev" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkBase, "cursor-not-allowed opacity-40")} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === current ? "page" : undefined}
          className={cn(
            linkBase,
            p === current && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {p}
        </Link>
      ))}

      {current < totalPages ? (
        <Link href={href(current + 1)} className={linkBase} rel="next" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkBase, "cursor-not-allowed opacity-40")} aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

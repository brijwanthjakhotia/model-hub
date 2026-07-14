import { RatingStars } from "@/components/ui/rating-stars";
import { pluralize } from "@/lib/utils";

export function ReviewSummary({
  average,
  count,
  distribution,
}: {
  average: number;
  count: number;
  distribution: Record<number, number>;
}) {
  return (
    <div className="card-surface flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center justify-center sm:w-40 sm:border-r sm:border-border sm:pr-6">
        <span className="font-display text-5xl font-semibold">
          {average.toFixed(1)}
        </span>
        <RatingStars value={average} size="md" className="mt-2" />
        <span className="mt-2 text-sm text-muted-foreground">
          {count} {pluralize(count, "review")}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const value = distribution[star] ?? 0;
          const pct = count ? (value / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-3 text-muted-foreground">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs text-muted-foreground">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

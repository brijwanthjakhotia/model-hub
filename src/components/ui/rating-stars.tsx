import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/** Read-only star rating that supports fractional fill.
 *
 *  The stars are decorative (`aria-hidden`) by default — fine where a numeric
 *  label sits beside them. Pass `label` where the stars are the *only* rating
 *  representation (e.g. a review row) so assistive tech can read the score. */
export function RatingStars({
  value,
  size = "md",
  className,
  label,
}: {
  value: number;
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  const stars = [0, 1, 2, 3, 4];
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {stars.map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(sizeMap[size], "text-muted-foreground/30")} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className={cn(sizeMap[size], "fill-accent text-accent")}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

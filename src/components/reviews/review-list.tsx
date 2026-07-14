import { RatingStars } from "@/components/ui/rating-stars";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  author: { name: string; avatarUrl: string | null };
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="card-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={review.author.name} src={review.author.avatarUrl} size={40} />
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {review.author.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(review.createdAt)}
                </p>
              </div>
            </div>
            <RatingStars value={review.rating} size="sm" />
          </div>
          {review.title && (
            <p className="mt-3 font-medium">{review.title}</p>
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {review.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

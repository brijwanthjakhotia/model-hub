"use client";

import { useActionState, useRef, useState } from "react";
import { Star } from "lucide-react";
import { addReviewAction, type ReviewState } from "@/actions/reviews";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { cn } from "@/lib/utils";

const initial: ReviewState = {};

export function ReviewForm({ modelId }: { modelId: string }) {
  const [state, formAction] = useActionState(addReviewAction, initial);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radiogroup keyboard contract: arrows move + commit the selection.
  function onStarKeyDown(e: React.KeyboardEvent, n: number) {
    let next = 0;
    // From the empty state (focus on star 1), an arrow commits the focused star
    // rather than skipping; thereafter it steps within 1..5.
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = rating === 0 ? n : Math.min(5, rating + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = rating === 0 ? n : Math.max(1, rating - 1);
    else return;
    e.preventDefault();
    setRating(next);
    starRefs.current[next - 1]?.focus();
  }

  if (state.success) {
    return (
      <div
        role="status"
        className="card-surface flex flex-col items-center gap-2 p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Star className="h-6 w-6 fill-current" />
        </div>
        <h3 className="text-lg font-semibold">Thank you for your review!</h3>
        <p className="text-sm text-muted-foreground">
          Your feedback has been published on this profile.
        </p>
      </div>
    );
  }

  const display = hover || rating;

  return (
    <form action={formAction} className="card-surface space-y-4 p-6">
      <div>
        <h3 className="text-lg font-semibold">Write a review</h3>
        <p className="text-sm text-muted-foreground">
          Share your experience working with this model.
        </p>
      </div>

      <input type="hidden" name="modelId" value={modelId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span id="rating-label" className="mb-1.5 block text-sm font-medium">
          Your rating
        </span>
        <div className="flex items-center gap-1" role="radiogroup" aria-labelledby="rating-label">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              ref={(el) => {
                starRefs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={n === rating}
              tabIndex={rating === n || (rating === 0 && n === 1) ? 0 : -1}
              onClick={() => setRating(n)}
              onKeyDown={(e) => onStarKeyDown(e, n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="rounded p-0.5 focus-ring"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  n <= display
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/30",
                )}
              />
            </button>
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.rating} />
      </div>

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          placeholder="Summarise your experience"
          maxLength={120}
        />
      </Field>

      <Field
        label="Review"
        htmlFor="body"
        required
        error={state.fieldErrors?.body}
      >
        <Textarea
          id="body"
          name="body"
          placeholder="What was it like working with this model?"
          required
        />
      </Field>

      <FormMessage>{state.error}</FormMessage>

      <SubmitButton pendingText="Publishing…" className="w-full sm:w-auto">
        Publish review
      </SubmitButton>
    </form>
  );
}


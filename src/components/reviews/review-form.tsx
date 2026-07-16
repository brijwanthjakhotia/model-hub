"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { addReviewAction, type ReviewState } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { cn } from "@/lib/utils";

const initial: ReviewState = {};

export function ReviewForm({ modelId }: { modelId: string }) {
  const [state, formAction] = useActionState(addReviewAction, initial);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.success) {
    return (
      <div className="card-surface flex flex-col items-center gap-2 p-8 text-center">
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
        <span className="mb-1.5 block text-sm font-medium">Your rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
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

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Publishing…" : "Publish review"}
    </Button>
  );
}

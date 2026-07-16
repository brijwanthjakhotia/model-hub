"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validations";

export type ReviewState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Recompute the denormalised rating cache for a model, inside a transaction.
 *
 * INVARIANT: any path that adds, edits or removes a Review must call this for
 * the affected model in the same transaction. Today the only writer is
 * `addReviewAction` (upsert). If a review-delete or user-erasure feature is
 * added, note that deleting a User cascade-deletes their reviews at the DB
 * level and would bypass this — such a path must recompute the affected models
 * (or the cache will drift). Model deletion is exempt (the row is gone).
 */
async function recomputeRating(tx: Prisma.TransactionClient, modelId: string) {
  const agg = await tx.review.aggregate({
    where: { modelId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.model.update({
    where: { id: modelId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count._all,
    },
  });
}

export async function addReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    modelId: formData.get("modelId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const model = await prisma.model.findUnique({
    where: { id: parsed.data.modelId },
    select: { id: true, slug: true, status: true, submittedById: true },
  });

  // Authenticate (and enforce ACTIVE status) BEFORE revealing whether the
  // target exists or is reviewable.
  const user = await requireUser(
    model ? `/login?next=/models/${model.slug}` : "/login",
  );

  if (!model || model.status !== "APPROVED") {
    return { error: "This profile is not available for reviews." };
  }
  if (model.submittedById === user.id) {
    return { error: "You cannot review a profile you submitted." };
  }

  // Throttle per member (the upsert already bounds one row per model per user).
  if (!rateLimit(`review:${user.id}`, 20, 60 * 60 * 1000).ok) {
    return { error: "You're posting reviews too quickly. Please try again later." };
  }

  // Write the review and recompute the cached rating atomically, so the two can
  // never diverge (crash between them, or interleaved concurrent reviews).
  await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: { modelId_authorId: { modelId: model.id, authorId: user.id } },
      create: {
        modelId: model.id,
        authorId: user.id,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
      },
      update: {
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
      },
    });
    await recomputeRating(tx, model.id);
  });

  revalidatePath(`/models/${model.slug}`);
  return { success: true };
}

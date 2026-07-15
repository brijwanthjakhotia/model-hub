"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";

export type ReviewState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/** Recompute the denormalised rating cache for a model. */
async function recomputeRating(modelId: string) {
  const agg = await prisma.review.aggregate({
    where: { modelId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.model.update({
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
  if (!model || model.status !== "APPROVED") {
    return { error: "This profile is not available for reviews." };
  }

  // Redirects unauthenticated users to login, and blocks non-ACTIVE members.
  const user = await requireUser(`/login?next=/models/${model.slug}`);

  if (model.submittedById === user.id) {
    return { error: "You cannot review a profile you submitted." };
  }

  await prisma.review.upsert({
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

  await recomputeRating(model.id);
  revalidatePath(`/models/${model.slug}`);
  return { success: true };
}

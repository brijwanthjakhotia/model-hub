import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { ModelProfileView } from "@/components/models/model-profile-view";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getModelBySlug, getRatingDistribution } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) return { title: "Profile not found" };
  return {
    title: model.name,
    description: `${model.name} — ${model.category} model based in ${model.location}. ${model.bio.slice(0, 140)}`,
  };
}

export default async function ModelProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [model, user] = await Promise.all([getModelBySlug(slug), getCurrentUser()]);

  if (!model) notFound(); // getModelBySlug returns only APPROVED profiles

  // Distribution is aggregated in the DB (not from the take:50-capped list), so
  // the histogram stays accurate for models with more than 50 reviews.
  const distribution = await getRatingDistribution(model.id);

  const isOwner = user?.id === model.submittedById;
  const hasReviewed = user
    ? model.reviews.some((r) => r.author.id === user.id)
    : false;

  // Only ACTIVE members can post reviews, so a suspended/pending member (who may
  // still hold a valid session cookie) sees a notice instead of the form. The
  // extra read only runs for signed-in visitors. Mirrors the requireUser gate
  // that addReviewAction enforces on submit.
  let isActiveMember = false;
  if (user) {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { status: true },
    });
    isActiveMember = account?.status === "ACTIVE";
  }

  return (
    <div className="container py-8 lg:py-12">
      <Link
        href="/models"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to gallery
      </Link>

      <ModelProfileView model={model} />

      {/* Reviews */}
      <section className="mt-16 border-t border-border pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <h2 className="text-2xl font-semibold">
              Reviews{" "}
              <span className="text-muted-foreground">({model.ratingCount})</span>
            </h2>

            {model.ratingCount > 0 ? (
              <div className="mt-6">
                <ReviewSummary
                  average={model.ratingAvg}
                  count={model.ratingCount}
                  distribution={distribution}
                />
                <div className="mt-6">
                  <ReviewList reviews={model.reviews} />
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={MessageSquare}
                  title="No reviews yet"
                  description="Be the first to share your experience working with this model."
                />
              </div>
            )}
          </div>

          {/* Review form / prompts */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {!user ? (
              <div className="card-surface p-6 text-center">
                <h3 className="text-lg font-semibold">Share your experience</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Sign in to leave a review for {model.name}.
                </p>
                <ButtonLink
                  href={`/login?next=/models/${model.slug}`}
                  className="mt-4 w-full"
                >
                  Sign in to review
                </ButtonLink>
              </div>
            ) : !isActiveMember ? (
              <div className="card-surface p-6 text-center text-sm text-muted-foreground">
                Your account isn&apos;t active, so you can&apos;t post reviews
                right now. Please contact support if you think this is a mistake.
              </div>
            ) : isOwner ? (
              <div className="card-surface p-6 text-center text-sm text-muted-foreground">
                You submitted this profile, so you can&apos;t review it.
              </div>
            ) : (
              <div className="space-y-3">
                {hasReviewed && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    You&apos;ve already reviewed this model — submitting again
                    will update your review.
                  </p>
                )}
                <ReviewForm modelId={model.id} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

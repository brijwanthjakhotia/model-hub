import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Ruler,
  Sparkles,
} from "lucide-react";
import { ProfileGallery } from "@/components/models/profile-gallery";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getModelBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseGallery } from "@/lib/utils";

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

  const galleryImages = [
    ...(model.headshotUrl ? [model.headshotUrl] : []),
    ...parseGallery(model.gallery),
  ];

  const distribution = model.reviews.reduce<Record<number, number>>((acc, r) => {
    acc[r.rating] = (acc[r.rating] ?? 0) + 1;
    return acc;
  }, {});

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

  const measurements = [
    { label: "Height", value: `${model.heightCm} cm` },
    model.bust ? { label: "Bust", value: `${model.bust} cm` } : null,
    model.waist ? { label: "Waist", value: `${model.waist} cm` } : null,
    model.hips ? { label: "Hips", value: `${model.hips} cm` } : null,
    model.shoeEu ? { label: "Shoe (EU)", value: `${model.shoeEu}` } : null,
    model.hairColor ? { label: "Hair", value: model.hairColor } : null,
    model.eyeColor ? { label: "Eyes", value: model.eyeColor } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="container py-8 lg:py-12">
      <Link
        href="/models"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to gallery
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left: gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProfileGallery name={model.name} images={galleryImages} />
        </div>

        {/* Right: details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{model.category}</Badge>
            {model.featured && (
              <Badge tone="default">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
            <Badge tone="outline">{model.experience}</Badge>
          </div>

          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
            {model.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {model.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4" />
              {model.heightCm} cm
            </span>
            {model.ratingCount > 0 && (
              <span className="flex items-center gap-1.5">
                <RatingStars value={model.ratingAvg} size="sm" />
                <span className="font-medium text-foreground">
                  {model.ratingAvg.toFixed(1)}
                </span>
                ({model.ratingCount})
              </span>
            )}
          </div>

          {/* Contact links */}
          {(model.instagram || model.agencyEmail) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {model.instagram && (
                <a
                  href={`https://instagram.com/${model.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Instagram className="h-4 w-4" />
                  @{model.instagram.replace(/^@/, "")}
                </a>
              )}
              {model.agencyEmail && (
                <a
                  href={`mailto:${model.agencyEmail}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {model.bio}
            </p>
          </div>

          {/* Measurements */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Statistics</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {measurements.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-border bg-muted/40 px-4 py-3"
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-lg font-semibold">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

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

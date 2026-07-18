import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GENDERS, type SortOption } from "@/lib/constants";

export type GalleryFilters = {
  q?: string;
  category?: string;
  gender?: string;
  experience?: string;
  sort?: SortOption;
};

/** Columns the gallery/landing card grid actually renders — avoids shipping
 *  the long `bio` and `gallery` JSON on list queries. */
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  headshotUrl: true,
  category: true,
  featured: true,
  experience: true,
  ratingAvg: true,
  ratingCount: true,
  location: true,
  heightCm: true,
} satisfies Prisma.ModelSelect;

/** Columns the member dashboard renders for a user's own submissions. */
const submissionRowSelect = {
  id: true,
  slug: true,
  name: true,
  headshotUrl: true,
  category: true,
  location: true,
  status: true,
  ratingAvg: true,
  ratingCount: true,
  reviewNote: true,
  createdAt: true,
} satisfies Prisma.ModelSelect;

/** Columns the admin roster table renders. */
const adminRowSelect = {
  id: true,
  slug: true,
  name: true,
  headshotUrl: true,
  category: true,
  location: true,
  status: true,
  featured: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
} satisfies Prisma.ModelSelect;

function buildOrderBy(
  sort: SortOption | undefined,
): Prisma.ModelOrderByWithRelationInput[] {
  switch (sort) {
    case "top-rated":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "name":
      return [{ name: "asc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { ratingAvg: "desc" }, { createdAt: "desc" }];
  }
}

export async function getApprovedModels(filters: GalleryFilters = {}) {
  const where: Prisma.ModelWhereInput = { status: "APPROVED" };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { location: { contains: filters.q } },
      { bio: { contains: filters.q } },
      { category: { contains: filters.q } },
    ];
  }
  if (filters.category) where.category = filters.category;
  // Validate against known genders so a bad ?gender=… param is ignored rather
  // than casting an arbitrary string onto the enum filter (which throws).
  if (filters.gender && GENDERS.some((g) => g.value === filters.gender)) {
    where.gender = filters.gender as Prisma.ModelWhereInput["gender"];
  }
  if (filters.experience) where.experience = filters.experience;

  return prisma.model.findMany({
    where,
    orderBy: buildOrderBy(filters.sort),
    select: cardSelect,
  });
}

export async function getFeaturedModels(take = 3) {
  return prisma.model.findMany({
    where: { status: "APPROVED", featured: true },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take,
    select: cardSelect,
  });
}

// Wrapped in React `cache()` so the profile page and its `generateMetadata`
// (which both call this per request) share a single query instead of running
// the heavy reviews+author include twice.
export const getModelBySlug = cache(async (slug: string) => {
  // APPROVED-only: a PENDING/REJECTED profile must not surface via its URL
  // (name/bio would otherwise leak into the response even on a 404 page).
  return prisma.model.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        // Bound the nested read: show the newest reviews (the ratingAvg/ratingCount
        // cache already drives the summary). A "load more" is a future follow-up.
        take: 50,
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      submittedBy: { select: { id: true, name: true } },
    },
  });
});

// Full profile for the admin preview — by id, ANY status (so staff can review a
// PENDING/REJECTED submission before deciding). Admin-gated at the page/route
// level; never used by public reads.
export const getModelForAdmin = cache(async (id: string) => {
  return prisma.model.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        // Bound the nested read: show the newest reviews (the ratingAvg/ratingCount
        // cache already drives the summary). A "load more" is a future follow-up.
        take: 50,
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });
});

/**
 * Full 1–5 star distribution for a model, aggregated in the DB (independent of
 * the `take` cap on the reviews list). Returns { [rating]: count } with zeros
 * omitted; callers render it against the cached ratingCount.
 */
export async function getRatingDistribution(modelId: string): Promise<Record<number, number>> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { modelId },
    _count: { _all: true },
  });
  return grouped.reduce<Record<number, number>>((acc, g) => {
    acc[g.rating] = g._count._all;
    return acc;
  }, {});
}

export async function getCategoryCounts() {
  const grouped = await prisma.model.groupBy({
    by: ["category"],
    where: { status: "APPROVED" },
    _count: { _all: true },
  });
  return grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = g._count._all;
    return acc;
  }, {});
}

export async function getPendingModels() {
  return prisma.model.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    // Only the columns ApprovalCard renders — avoids shipping unused stats.
    select: {
      id: true,
      name: true,
      category: true,
      location: true,
      heightCm: true,
      experience: true,
      bio: true,
      headshotUrl: true,
      gallery: true,
      instagram: true,
      createdAt: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });
}

export async function getAllModelsForAdmin() {
  return prisma.model.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: adminRowSelect,
  });
}

export async function getUserSubmissions(userId: string) {
  return prisma.model.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: "desc" },
    select: submissionRowSelect,
  });
}

export async function getMembers() {
  return prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { models: true, reviews: true } },
    },
  });
}

// cache()-wrapped: the console layout and the /admin overview page both call
// this in the same request, so share one set of COUNTs instead of running all
// seven twice.
export const getAdminStats = cache(async () => {
  const [total, pending, approved, rejected, reviews, users, pendingMembers] =
    await Promise.all([
      prisma.model.count(),
      prisma.model.count({ where: { status: "PENDING" } }),
      prisma.model.count({ where: { status: "APPROVED" } }),
      prisma.model.count({ where: { status: "REJECTED" } }),
      prisma.review.count(),
      prisma.user.count(),
      prisma.user.count({ where: { status: "PENDING" } }),
    ]);
  return { total, pending, approved, rejected, reviews, users, pendingMembers };
});

export async function getSiteStats() {
  const [models, reviews, countries] = await Promise.all([
    prisma.model.count({ where: { status: "APPROVED" } }),
    prisma.review.count(),
    prisma.model.findMany({
      where: { status: "APPROVED" },
      select: { location: true },
      distinct: ["location"],
    }),
  ]);
  return { models, reviews, countries: countries.length };
}

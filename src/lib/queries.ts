import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SortOption } from "@/lib/constants";

export type GalleryFilters = {
  q?: string;
  category?: string;
  gender?: string;
  experience?: string;
  sort?: SortOption;
};

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
  if (filters.gender) where.gender = filters.gender as Prisma.ModelWhereInput["gender"];
  if (filters.experience) where.experience = filters.experience;

  return prisma.model.findMany({
    where,
    orderBy: buildOrderBy(filters.sort),
  });
}

export async function getFeaturedModels(take = 3) {
  return prisma.model.findMany({
    where: { status: "APPROVED", featured: true },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getModelBySlug(slug: string) {
  return prisma.model.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      submittedBy: { select: { id: true, name: true } },
    },
  });
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
    include: { submittedBy: { select: { name: true, email: true } } },
  });
}

export async function getAllModelsForAdmin() {
  return prisma.model.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { submittedBy: { select: { name: true } } },
  });
}

export async function getUserSubmissions(userId: string) {
  return prisma.model.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminStats() {
  const [total, pending, approved, rejected, reviews, users] = await Promise.all([
    prisma.model.count(),
    prisma.model.count({ where: { status: "PENDING" } }),
    prisma.model.count({ where: { status: "APPROVED" } }),
    prisma.model.count({ where: { status: "REJECTED" } }),
    prisma.review.count(),
    prisma.user.count(),
  ]);
  return { total, pending, approved, rejected, reviews, users };
}

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

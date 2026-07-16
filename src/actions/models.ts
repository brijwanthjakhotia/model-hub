"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { modelSchema, reviewDecisionSchema } from "@/lib/validations";
import { parseGalleryUrls, slugify } from "@/lib/utils";

export type ModelFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
const isNotFound = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

export async function createModelAction(
  _prev: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  const user = await requireUser("/login?next=/submit");

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const d = parsed.data;
  const base = slugify(d.name) || "model";
  const data = {
    name: d.name,
    category: d.category,
    gender: d.gender,
    location: d.location,
    experience: d.experience,
    bio: d.bio,
    heightCm: d.heightCm,
    bust: d.bust,
    waist: d.waist,
    hips: d.hips,
    shoeEu: d.shoeEu,
    hairColor: d.hairColor || null,
    eyeColor: d.eyeColor || null,
    instagram: d.instagram || null,
    agencyEmail: d.agencyEmail || null,
    headshotUrl: d.headshotUrl || null,
    gallery: JSON.stringify(parseGalleryUrls(d.gallery)),
    status: "PENDING" as const,
    submittedById: user.id,
  };

  // Create with a unique slug, retrying on the rare collision (P2002) rather
  // than a check-then-create that races two concurrent same-named submissions.
  for (let attempt = 0; ; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      await prisma.model.create({ data: { ...data, slug } });
      break;
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 25) continue;
      throw e;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/approvals");
  redirect("/dashboard?submitted=1");
}

export async function decideModelAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = reviewDecisionSchema.safeParse({
    modelId: formData.get("modelId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error("Invalid decision payload");
  }

  const { modelId, decision, note } = parsed.data;

  try {
    await prisma.model.update({
      where: { id: modelId },
      data: {
        status: decision,
        reviewNote: note || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
  } catch (e) {
    if (isNotFound(e)) throw new Error("That profile no longer exists.");
    throw e;
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/models");
}

export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) throw new Error("Missing model id");

  // Read + flip in one transaction so concurrent toggles can't clobber each
  // other (read-modify-write TOCTOU on the boolean).
  await prisma.$transaction(async (tx) => {
    const model = await tx.model.findUnique({
      where: { id: modelId },
      select: { featured: true },
    });
    if (!model) throw new Error("That profile no longer exists.");
    await tx.model.update({
      where: { id: modelId },
      data: { featured: !model.featured },
    });
  });

  revalidatePath("/admin/models");
  revalidatePath("/");
  revalidatePath("/models");
}

export async function deleteModelAction(formData: FormData) {
  await requireAdmin();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) throw new Error("Missing model id");

  try {
    await prisma.model.delete({ where: { id: modelId } });
  } catch (e) {
    if (isNotFound(e)) throw new Error("That profile no longer exists.");
    throw e;
  }

  revalidatePath("/admin/models");
  revalidatePath("/models");
}

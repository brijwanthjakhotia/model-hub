"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { modelSchema, reviewDecisionSchema } from "@/lib/validations";
import { parseGalleryUrls, slugify } from "@/lib/utils";

export type ModelFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

async function uniqueSlug(name: string) {
  const base = slugify(name) || "model";
  let slug = base;
  let n = 1;
  while (await prisma.model.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createModelAction(
  _prev: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/submit");

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const d = parsed.data;
  const slug = await uniqueSlug(d.name);

  await prisma.model.create({
    data: {
      slug,
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
      status: "PENDING",
      submittedById: user.id,
    },
  });

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

  await prisma.model.update({
    where: { id: modelId },
    data: {
      status: decision,
      reviewNote: note || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/models");
}

export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const modelId = String(formData.get("modelId") ?? "");
  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model) throw new Error("Model not found");

  await prisma.model.update({
    where: { id: modelId },
    data: { featured: !model.featured },
  });

  revalidatePath("/admin/models");
  revalidatePath("/");
  revalidatePath("/models");
}

export async function deleteModelAction(formData: FormData) {
  await requireAdmin();
  const modelId = String(formData.get("modelId") ?? "");
  await prisma.model.delete({ where: { id: modelId } });
  revalidatePath("/admin/models");
  revalidatePath("/models");
}

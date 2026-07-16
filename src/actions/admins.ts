"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminSchema } from "@/lib/validations";

export type AdminFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export async function createAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireSuperAdmin();

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = createAdminSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { name: raw.name, email: raw.email, role: raw.role },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    // Rely on the unique constraint rather than a check-then-create (which
    // races): a duplicate email throws P2002, which we map to a friendly error.
    await prisma.admin.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error: "An admin with that email already exists.",
        values: { name: raw.name, email: raw.email, role: raw.role },
      };
    }
    throw e;
  }

  revalidatePath("/admin/admins");
  return { success: `Admin “${parsed.data.name}” created.` };
}

export async function deleteAdminAction(formData: FormData) {
  const current = await requireSuperAdmin();
  const adminId = String(formData.get("adminId") ?? "");

  // Never let an admin delete themselves out of the console.
  if (adminId === current.id) {
    throw new Error("You cannot delete your own admin account.");
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.admin.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (!target) throw new Error("That admin no longer exists.");

    // Clear the approval metadata this admin authored as a unit, so no model is
    // left with a decision timestamp/note but a null reviewer (the FK would
    // otherwise SET NULL only `reviewedById`).
    await tx.model.updateMany({
      where: { reviewedById: adminId },
      data: { reviewedById: null, reviewedAt: null, reviewNote: null },
    });

    await tx.admin.delete({ where: { id: adminId } });

    // Recount AFTER the delete (not before): under SQLite's serialized writes a
    // concurrent delete blocks until this commits, so a delete-then-check can't
    // let two requests both leave zero super admins. Throwing rolls it back.
    if (target.role === "SUPER_ADMIN") {
      const remaining = await tx.admin.count({ where: { role: "SUPER_ADMIN" } });
      if (remaining < 1) throw new Error("Cannot remove the last super admin.");
    }
  });

  revalidatePath("/admin/admins");
}

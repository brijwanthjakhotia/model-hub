"use server";

import bcrypt from "bcryptjs";
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

  const existing = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      error: "An admin with that email already exists.",
      values: { name: raw.name, email: raw.email, role: raw.role },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.admin.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

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

  // Don't allow removing the last SUPER_ADMIN — the console would be orphaned.
  const target = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!target) throw new Error("Admin not found");
  if (target.role === "SUPER_ADMIN") {
    const superAdmins = await prisma.admin.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdmins <= 1) {
      throw new Error("Cannot remove the last super admin.");
    }
  }

  await prisma.admin.delete({ where: { id: adminId } });
  revalidatePath("/admin/admins");
}

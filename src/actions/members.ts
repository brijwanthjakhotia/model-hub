"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { userStatusSchema } from "@/lib/validations";
import { isNotFound } from "@/lib/prisma-errors";

/** Change a member's account status (any admin). */
export async function updateMemberStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = userStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    throw new Error("Invalid status payload");
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { status: parsed.data.status },
    });
  } catch (e) {
    if (isNotFound(e)) {
      throw new Error("That member no longer exists.");
    }
    throw e;
  }

  revalidatePath("/admin/members");
}

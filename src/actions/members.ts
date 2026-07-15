"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { userStatusSchema } from "@/lib/validations";

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

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/members");
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, createSession } from "@/lib/auth";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { tooManyMsg } from "@/lib/auth-messages";
import { isUniqueViolation } from "@/lib/prisma-errors";
import type { AuthState } from "@/actions/auth";

/**
 * Update the signed-in member's own profile (name, email, avatar). On an email
 * change the session cookie is re-issued so the header and future requests
 * carry the new identity. Requires an ACTIVE account (via `requireUser`).
 */
export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
  };
  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const { name, email } = parsed.data;
  const avatarUrl = parsed.data.avatarUrl ? parsed.data.avatarUrl : null;

  // Changing the login email requires re-entering the current password, so a
  // hijacked session can't silently repoint the account to an attacker's inbox.
  if (email !== user.email) {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!account) {
      return { error: "Your session has expired. Please sign in again." };
    }
    const currentPassword = String(formData.get("currentPassword") ?? "");
    if (!currentPassword || !(await bcrypt.compare(currentPassword, account.passwordHash))) {
      return {
        fieldErrors: {
          currentPassword: ["Enter your current password to change your email."],
        },
        values: raw,
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, email, avatarUrl },
    });
  } catch (e) {
    // A logged-in member editing their own account: surface the email clash
    // directly (they already know their own account exists).
    if (isUniqueViolation(e)) {
      return {
        fieldErrors: { email: ["That email is already in use."] },
        values: raw,
      };
    }
    throw e;
  }

  // Re-issue the session so the header + subsequent requests reflect the new
  // name/email, then refresh the layout that renders them.
  await createSession({ id: user.id, name, email, tokenVersion: user.tokenVersion });
  revalidatePath("/", "layout");

  return {
    success: "Your profile has been updated.",
    values: { name, email, avatarUrl: parsed.data.avatarUrl ?? "" },
  };
}

/**
 * Change the signed-in member's password. Verifies the current password before
 * setting the new hash. Rate-limited per account so a hijacked session can't be
 * used to brute-force the current password.
 */
export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const limit = rateLimit(`change-pw:${user.id}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { error: tooManyMsg(limit.retryAfterSec) };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
  if (!ok) {
    return { fieldErrors: { currentPassword: ["That password is incorrect."] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  // Atomically: set the new hash, bump tokenVersion (invalidates every other
  // outstanding session), and clear any outstanding reset tokens — so the
  // invalidation can never be left half-applied. This session is re-issued
  // below with the new tokenVersion so the current device stays signed in.
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
  ]);

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    tokenVersion: updated.tokenVersion,
  });

  return { success: "Your password has been changed." };
}

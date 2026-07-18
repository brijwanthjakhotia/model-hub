"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { tooManyMsg } from "@/lib/auth-messages";
import { sendPasswordResetEmail, getBaseUrl } from "@/lib/mailer";
import type { AuthState } from "@/actions/auth";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Same wording whether or not the email maps to an account (no enumeration). */
const GENERIC_SENT =
  "If an account exists for that email, we've sent a password reset link. Check your inbox.";

const hashToken = (raw: string) =>
  createHash("sha256").update(raw).digest("hex");

/**
 * Handle a "forgot password" request: create a single-use, 1-hour token for the
 * account (if one exists) and email the reset link. The response is identical
 * regardless of whether the email exists, and send failures are swallowed, so
 * neither the message nor timing reveals whether an account is registered.
 */
export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }
  const { email } = parsed.data;

  const byEmail = rateLimit(`forgot:email:${email}`, 5, 60 * 60 * 1000);
  if (!byEmail.ok) {
    return { error: tooManyMsg(byEmail.retryAfterSec), values: raw };
  }
  const ip = await clientIp();
  if (ip) {
    const byIp = rateLimit(`forgot:ip:${ip}`, 30, 60 * 60 * 1000);
    if (!byIp.ok) {
      return { error: tooManyMsg(byIp.retryAfterSec), values: raw };
    }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user) {
    try {
      // One live token per account: drop any earlier unused ones first.
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      const rawToken = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(rawToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });
      const base = await getBaseUrl();
      const url = `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail(user.email, url);
    } catch (err) {
      // Never let a DB/SMTP hiccup turn into a different response for a real
      // account — log server-side and fall through to the generic message.
      console.error("[password-reset] failed to issue reset token:", err);
    }
  }

  return { success: GENERIC_SENT, values: raw };
}

/**
 * Complete a password reset from an emailed token. Validates the token (exists,
 * unused, unexpired), sets the new password, then consumes the token and clears
 * any siblings. On success, redirects to the login page.
 */
export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { token: raw.token },
    };
  }

  const ip = await clientIp();
  if (ip) {
    const byIp = rateLimit(`reset:ip:${ip}`, 30, 60 * 60 * 1000);
    if (!byIp.ok) {
      return { error: tooManyMsg(byIp.retryAfterSec), values: { token: raw.token } };
    }
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  const invalid = { error: "This reset link is invalid or has expired. Please request a new one." };
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return invalid;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  // Set the password, consume this token, and drop every other token for the
  // account — atomically, so a token can't be replayed.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  redirect("/login?reset=1");
}

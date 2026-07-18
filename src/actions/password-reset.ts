"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
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
 * regardless of whether the email exists; the email is dispatched via `after()`
 * (post-response) and the miss path does equivalent crypto work, so neither the
 * message nor the response timing reveals whether an account is registered.
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

  // Opportunistic cleanup: prune every expired token (cheap — indexed on
  // expiresAt), so abandoned tokens from users who never return don't pile up.
  await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user) {
    try {
      // One token per account: clear any earlier ones (used or not) first.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
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
      const to = user.email;
      // Send after the response is flushed so SMTP round-trip latency can't be
      // used as an account-existence oracle.
      after(async () => {
        try {
          await sendPasswordResetEmail(to, url);
        } catch (err) {
          console.error("[password-reset] send failed:", err);
        }
      });
    } catch (err) {
      console.error("[password-reset] failed to issue reset token:", err);
    }
  } else {
    // Equalize crypto work with the hit path so timing doesn't leak existence.
    hashToken(randomBytes(32).toString("base64url"));
  }

  return { success: GENERIC_SENT, values: raw };
}

/**
 * Complete a password reset from an emailed token. Validates the token (exists,
 * unused, unexpired), then — atomically — consumes it (guarded on `usedAt IS
 * NULL` so it can't be replayed), sets the new password, bumps `tokenVersion`
 * to invalidate every existing session, and clears sibling tokens.
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

  const invalid = {
    error: "This reset link is invalid or has expired. Please request a new one.",
  };
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return invalid;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  // Consume + set password + invalidate sessions + drop siblings, atomically.
  // The `usedAt: null` guard makes consumption conditional, so two concurrent
  // submissions of the same token can't both succeed (no replay).
  const consumed = await prisma.$transaction(async (tx) => {
    const res = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (res.count === 0) return false;
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    });
    return true;
  });
  if (!consumed) return invalid;

  redirect("/login?reset=1");
}

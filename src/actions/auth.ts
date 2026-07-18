"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { safeRedirect } from "@/lib/utils";
import { statusLoginMessage, tooManyMsg } from "@/lib/auth-messages";
import { rateLimit, peekRateLimit, clientIp } from "@/lib/rate-limit";
import { isUniqueViolation } from "@/lib/prisma-errors";
import type { FormState } from "@/lib/form-state";

export type AuthState = FormState;

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { name: raw.name, email: raw.email },
    };
  }

  const regByEmail = rateLimit(`register:email:${parsed.data.email}`, 5, 60 * 60 * 1000);
  if (!regByEmail.ok) {
    return { error: tooManyMsg(regByEmail.retryAfterSec), values: { name: raw.name, email: raw.email } };
  }
  const ip = await clientIp();
  if (ip) {
    const regByIp = rateLimit(`register:ip:${ip}`, 100, 60 * 60 * 1000);
    if (!regByIp.ok) {
      return { error: tooManyMsg(regByIp.retryAfterSec), values: { name: raw.name, email: raw.email } };
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  // New members start PENDING and are not signed in. On a duplicate email we
  // deliberately do NOT reveal that the account exists (no enumeration): the
  // response is identical to a fresh signup.
  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });
  } catch (e) {
    if (!isUniqueViolation(e)) {
      throw e;
    }
  }

  redirect("/login?registered=pending");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: raw.email },
    };
  }

  // Gate on FAILED-attempt counts (peek, no increment). Only failures below are
  // counted, so a member's own successful sign-ins never consume the budget and
  // can't be used to lock them out. Per-account first (email key, can't be
  // sidestepped by rotating a spoofable IP); per-IP only with a trusted proxy.
  const acctKey = `login:acct:${parsed.data.email}`;
  const acctGate = peekRateLimit(acctKey, 10);
  if (!acctGate.ok) {
    return { error: tooManyMsg(acctGate.retryAfterSec), values: { email: raw.email } };
  }
  const ip = await clientIp();
  const ipKey = ip ? `login:ip:${ip}` : null;
  if (ipKey) {
    const ipGate = peekRateLimit(ipKey, 50);
    if (!ipGate.ok) {
      return { error: tooManyMsg(ipGate.retryAfterSec), values: { email: raw.email } };
    }
  }

  // Count a failed attempt (creates/extends the window). Successful logins never
  // call this, so they don't consume the lockout budget.
  const countFailure = () => {
    rateLimit(acctKey, 10, 15 * 60 * 1000);
    if (ipKey) rateLimit(ipKey, 50, 15 * 60 * 1000);
  };
  const invalid = { error: "Invalid email or password.", values: { email: raw.email } };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  // Burn a comparable amount of time when the email is unknown, so response
  // latency doesn't reveal whether an account exists.
  if (!user) {
    await bcrypt.hash(parsed.data.password, 10);
    countFailure();
    return invalid;
  }
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    countFailure();
    return invalid;
  }

  // Only ACTIVE members may sign in. Checked after the credential check so the
  // status is only revealed to whoever actually holds the password. Valid
  // credentials, so this is not counted as a failed attempt.
  if (user.status !== "ACTIVE") {
    return {
      error: statusLoginMessage(user.status),
      values: { email: raw.email },
    };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    tokenVersion: user.tokenVersion,
  });

  redirect(safeRedirect(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* Admin auth (separate Admin table + cookie)                                 */
/* -------------------------------------------------------------------------- */

export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: raw.email },
    };
  }

  // Failure-only lockout (see loginAction): peek to gate, count only failures,
  // so a real admin's successful sign-ins never lock the console.
  const acctKey = `admin-login:acct:${parsed.data.email}`;
  const acctGate = peekRateLimit(acctKey, 5);
  if (!acctGate.ok) {
    return { error: tooManyMsg(acctGate.retryAfterSec), values: { email: raw.email } };
  }
  const ip = await clientIp();
  const ipKey = ip ? `admin-login:ip:${ip}` : null;
  if (ipKey) {
    const ipGate = peekRateLimit(ipKey, 30);
    if (!ipGate.ok) {
      return { error: tooManyMsg(ipGate.retryAfterSec), values: { email: raw.email } };
    }
  }

  const countFailure = () => {
    rateLimit(acctKey, 5, 15 * 60 * 1000);
    if (ipKey) rateLimit(ipKey, 30, 15 * 60 * 1000);
  };
  const invalid = { error: "Invalid email or password.", values: { email: raw.email } };

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });
  if (!admin) {
    await bcrypt.hash(parsed.data.password, 10); // equalize timing
    countFailure();
    return invalid;
  }
  if (!(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    countFailure();
    return invalid;
  }

  await createAdminSession({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });

  redirect(safeRedirect(formData.get("next"), "/admin"));
}

export async function adminLogoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

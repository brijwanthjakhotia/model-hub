"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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
import { statusLoginMessage } from "@/lib/auth-messages";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

function tooManyMsg(retryAfterSec: number): string {
  const mins = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Too many attempts. Please try again in about ${mins} minute${mins === 1 ? "" : "s"}.`;
}

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
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
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

  // Per-account cap first: keyed on the email, so it can't be sidestepped by
  // rotating a (spoofable) IP. Then a coarser per-IP cap for spray attacks —
  // only when we have a trustworthy IP, so it can't be turned into a global
  // lockout.
  const loginByAcct = rateLimit(`login:acct:${parsed.data.email}`, 10, 15 * 60 * 1000);
  if (!loginByAcct.ok) {
    return { error: tooManyMsg(loginByAcct.retryAfterSec), values: { email: raw.email } };
  }
  const ip = await clientIp();
  if (ip) {
    const loginByIp = rateLimit(`login:ip:${ip}`, 50, 15 * 60 * 1000);
    if (!loginByIp.ok) {
      return { error: tooManyMsg(loginByIp.retryAfterSec), values: { email: raw.email } };
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  // Burn a comparable amount of time when the email is unknown, so response
  // latency doesn't reveal whether an account exists.
  if (!user) {
    await bcrypt.hash(parsed.data.password, 10);
    return { error: "Invalid email or password.", values: { email: raw.email } };
  }
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password.", values: { email: raw.email } };
  }

  // Only ACTIVE members may sign in. Checked after the credential check so the
  // status is only revealed to whoever actually holds the password.
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

  const adminByAcct = rateLimit(`admin-login:acct:${parsed.data.email}`, 5, 15 * 60 * 1000);
  if (!adminByAcct.ok) {
    return { error: tooManyMsg(adminByAcct.retryAfterSec), values: { email: raw.email } };
  }
  const ip = await clientIp();
  if (ip) {
    const adminByIp = rateLimit(`admin-login:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!adminByIp.ok) {
      return { error: tooManyMsg(adminByIp.retryAfterSec), values: { email: raw.email } };
    }
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });
  if (!admin) {
    await bcrypt.hash(parsed.data.password, 10); // equalize timing
    return { error: "Invalid email or password.", values: { email: raw.email } };
  }
  if (!(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    return { error: "Invalid email or password.", values: { email: raw.email } };
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

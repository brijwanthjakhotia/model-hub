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

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

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

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      error: "An account with that email already exists.",
      values: { name: raw.name, email: raw.email },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  // New members start PENDING and cannot sign in until an admin activates them,
  // so we deliberately do NOT create a session here.
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return {
      error: "Invalid email or password.",
      values: { email: raw.email },
    };
  }

  // Only ACTIVE members may sign in. The credential check runs first so status
  // is only revealed to whoever actually holds the password.
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

/**
 * Message shown when a non-ACTIVE member tries to sign in. The two suspended
 * states share a message on purpose — we don't disclose a fraud flag.
 */
function statusLoginMessage(status: string): string {
  switch (status) {
    case "PENDING":
      return "Your account is awaiting approval. You'll be able to sign in once an admin activates it.";
    case "INACTIVE":
      return "Your account is inactive. Please contact support to reactivate it.";
    default: // SUSPENDED, SUSPENDED_FRAUD
      return "Your account has been suspended. Please contact support.";
  }
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

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });
  if (
    !admin ||
    !(await bcrypt.compare(parsed.data.password, admin.passwordHash))
  ) {
    return {
      error: "Invalid email or password.",
      values: { email: raw.email },
    };
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

"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
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
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect(safeRedirect(formData.get("next")));
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

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect(safeRedirect(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

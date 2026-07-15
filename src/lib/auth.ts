import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  signAdminSession,
  verifySession,
  verifyAdminSession,
  type SessionUser,
  type SessionAdmin,
} from "@/lib/session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/* -------------------------------------------------------------------------- */
/* Public users                                                               */
/* -------------------------------------------------------------------------- */

/** Read and verify the current user session from cookies (server-side). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Create the session cookie for a user. */
export async function createSession(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions);
}

/** Clear the user session cookie. */
export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Require an authenticated user, redirecting to login otherwise. */
export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/* -------------------------------------------------------------------------- */
/* Admins (separate table, separate cookie)                                   */
/* -------------------------------------------------------------------------- */

/** Read and verify the current admin session from cookies (server-side). */
export async function getCurrentAdmin(): Promise<SessionAdmin | null> {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Create the session cookie for an admin. */
export async function createAdminSession(admin: SessionAdmin) {
  const token = await signAdminSession(admin);
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, cookieOptions);
}

/** Clear the admin session cookie. */
export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/** Require a signed-in admin, redirecting to the admin login otherwise. */
export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?next=/admin");
  return admin;
}

/** Require a SUPER_ADMIN; other admins are sent back to the console. */
export async function requireSuperAdmin(): Promise<SessionAdmin> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");
  return admin;
}

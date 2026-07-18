import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

/**
 * Require an **ACTIVE** member.
 *
 * Redirects to `redirectTo` if not signed in, and — via a fresh DB read —
 * redirects to `/login?blocked=1` if the account has since been suspended,
 * deactivated or reset to pending. This re-check is what makes an admin status
 * change take effect immediately (on the member's next protected request),
 * rather than only at their next login. A Server Component can't clear cookies,
 * so a cut-off member is sent to the `/session/blocked` route handler, which
 * clears the (now-inert) session cookie before showing the login page.
 */
export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const session = await getCurrentUser();
  if (!session) redirect(redirectTo);

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, status: true, tokenVersion: true },
  });
  // Cut off if the account is no longer ACTIVE, or if the token predates a
  // password change/reset (tokenVersion mismatch) — the latter is what makes a
  // reset actually invalidate stolen/older sessions.
  if (!user || user.status !== "ACTIVE" || user.tokenVersion !== session.tokenVersion) {
    redirect("/session/blocked");
  }
  return { id: user.id, name: user.name, email: user.email, tokenVersion: user.tokenVersion };
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

/**
 * Require a signed-in admin. Redirects to the admin login if there's no session
 * and — via a fresh DB read — to `/session/admin-blocked` if the admin has since
 * been deleted. The role is re-read from the DB too, so a demotion (e.g.
 * SUPER_ADMIN → MODERATOR) takes effect immediately rather than lasting until
 * the 7-day token expires. Mirrors `requireUser`.
 */
export const requireAdmin = cache(async (): Promise<SessionAdmin> => {
  // cache()-wrapped: the (console) layout and each console page both call this
  // per request; share one verify + DB lookup instead of running it twice.
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login?next=/admin");

  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!admin) redirect("/session/admin-blocked");
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
});

/** Require a SUPER_ADMIN; other admins are sent back to the console. */
export async function requireSuperAdmin(): Promise<SessionAdmin> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin");
  return admin;
}

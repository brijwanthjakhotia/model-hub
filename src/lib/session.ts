import { SignJWT, jwtVerify } from "jose";
import { ADMIN_ROLES, type AdminRoleValue } from "@/lib/constants";

export const SESSION_COOKIE = "mh_session";
export const ADMIN_SESSION_COOKIE = "mh_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** A signed-in public user (no role — admin access is a separate table). */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/** Admin role, single-sourced from `constants` (which ties it to the Prisma enum). */
export type AdminRole = AdminRoleValue;

/** A signed-in admin. The role is carried in the token so the edge middleware
 *  can gate role-restricted routes without a DB lookup. */
export type SessionAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

async function verify(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

/** Sign a user session payload into a JWT string. */
export async function signSession(user: SessionUser) {
  return sign({ ...user });
}

/** Verify a user JWT and return the session payload, or null if invalid. */
export async function verifySession(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  const payload = await verify(token);
  if (
    payload &&
    payload.kind !== "admin" && // an admin token must never pass as a member
    typeof payload.id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.email === "string"
  ) {
    return { id: payload.id, name: payload.name, email: payload.email };
  }
  return null;
}

/** Sign an admin session payload into a JWT string. */
export async function signAdminSession(admin: SessionAdmin) {
  // `kind` guards against a user token ever being accepted as an admin token
  // (and vice-versa), even though the two live in different cookies.
  return sign({ ...admin, kind: "admin" });
}

/** Verify an admin JWT and return the session payload, or null if invalid. */
export async function verifyAdminSession(
  token: string | undefined | null,
): Promise<SessionAdmin | null> {
  const payload = await verify(token);
  if (
    payload &&
    payload.kind === "admin" &&
    typeof payload.id === "string" &&
    typeof payload.name === "string" &&
    typeof payload.email === "string" &&
    typeof payload.role === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(payload.role)
  ) {
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as AdminRoleValue,
    };
  }
  return null;
}

export const SESSION_MAX_AGE = MAX_AGE;

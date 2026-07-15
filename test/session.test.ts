import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import {
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  signAdminSession,
  verifyAdminSession,
  type SessionUser,
  type SessionAdmin,
} from "@/lib/session";

const user: SessionUser = {
  id: "user_123",
  name: "Jordan Rivera",
  email: "user@modelhub.test",
};

const admin: SessionAdmin = {
  id: "admin_123",
  name: "Agency Owner",
  email: "super@modelhub.test",
  role: "SUPER_ADMIN",
};

describe("session constants", () => {
  it("exposes stable cookie names and a 7-day max age", () => {
    expect(SESSION_COOKIE).toBe("mh_session");
    expect(ADMIN_SESSION_COOKIE).toBe("mh_admin");
    expect(SESSION_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});

describe("signSession / verifySession (users)", () => {
  it("round-trips a user session payload", async () => {
    const token = await signSession(user);
    expect(typeof token).toBe("string");
    expect(await verifySession(token)).toMatchObject(user);
  });

  it("returns null for missing tokens", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession(null)).toBeNull();
    expect(await verifySession("")).toBeNull();
  });

  it("returns null for a malformed token", async () => {
    expect(await verifySession("not.a.jwt")).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const foreign = new TextEncoder().encode("some-other-secret-value-000000000000");
    const token = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(foreign);
    expect(await verifySession(token)).toBeNull();
  });

  it("returns null when required claims are missing or malformed", async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const token = await new SignJWT({ id: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
    expect(await verifySession(token)).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const token = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("-1h") // already expired
      .sign(secret);
    expect(await verifySession(token)).toBeNull();
  });

  it("a user token can never be verified as an admin", async () => {
    // A user token has no `kind: "admin"` claim, so it can never grant admin.
    const userToken = await signSession(user);
    expect(await verifyAdminSession(userToken)).toBeNull();
  });
});

describe("signAdminSession / verifyAdminSession (admins)", () => {
  it("round-trips an admin session payload including the role", async () => {
    const token = await signAdminSession(admin);
    expect(await verifyAdminSession(token)).toMatchObject(admin);
  });

  it("accepts MODERATOR as a valid role", async () => {
    const mod: SessionAdmin = { ...admin, role: "MODERATOR" };
    const token = await signAdminSession(mod);
    expect((await verifyAdminSession(token))?.role).toBe("MODERATOR");
  });

  it("returns null for an unknown role", async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const token = await new SignJWT({ ...admin, kind: "admin", role: "OWNER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
    expect(await verifyAdminSession(token)).toBeNull();
  });

  it("rejects an admin-shaped token that lacks the kind claim", async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const token = await new SignJWT({ ...admin }) // no kind: "admin"
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
    expect(await verifyAdminSession(token)).toBeNull();
  });

  it("returns null for missing tokens", async () => {
    expect(await verifyAdminSession(undefined)).toBeNull();
    expect(await verifyAdminSession("")).toBeNull();
  });
});

describe("signSession without AUTH_SECRET", () => {
  const original = process.env.AUTH_SECRET;
  beforeEach(() => {
    delete process.env.AUTH_SECRET;
  });
  afterEach(() => {
    process.env.AUTH_SECRET = original;
  });

  it("throws a clear error when the secret is not configured", async () => {
    await expect(signSession(user)).rejects.toThrow(/AUTH_SECRET/);
    await expect(signAdminSession(admin)).rejects.toThrow(/AUTH_SECRET/);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionUser,
} from "@/lib/session";

const user: SessionUser = {
  id: "user_123",
  name: "Agency Admin",
  email: "admin@modelhub.test",
  role: "ADMIN",
};

describe("session constants", () => {
  it("exposes a stable cookie name and a 7-day max age", () => {
    expect(SESSION_COOKIE).toBe("mh_session");
    expect(SESSION_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});

describe("signSession / verifySession", () => {
  it("round-trips a session payload", async () => {
    const token = await signSession(user);
    expect(typeof token).toBe("string");
    const payload = await verifySession(token);
    expect(payload).toMatchObject(user);
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
    const token = await new SignJWT({ id: "x", role: "SUPERADMIN" })
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
  });
});

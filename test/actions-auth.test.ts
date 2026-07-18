import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

/* --- mocks for the action's collaborators ------------------------------- */
// vi.mock is hoisted above imports, so shared mock state must be created with
// vi.hoisted (which also runs first) to be referencable in the factories.
const {
  redirect,
  createSession,
  destroySession,
  createAdminSession,
  destroyAdminSession,
  rateLimit,
  peekRateLimit,
  prisma,
} = vi.hoisted(() => ({
  // redirect() throws in Next; model that so we can assert the target.
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  createAdminSession: vi.fn(),
  destroyAdminSession: vi.fn(),
  rateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
  peekRateLimit: vi.fn(() => ({ ok: true, retryAfterSec: 0 })),
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    admin: { findUnique: vi.fn() },
  },
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({
  createSession,
  destroySession,
  createAdminSession,
  destroyAdminSession,
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit,
  peekRateLimit,
  clientIp: async () => "test-ip",
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { Prisma } from "@prisma/client";
import {
  adminLoginAction,
  adminLogoutAction,
  loginAction,
  logoutAction,
  registerAction,
} from "@/actions/auth";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

beforeEach(() => {
  rateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 });
  peekRateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 });
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("registerAction", () => {
  it("creates a PENDING member, does NOT sign in, and redirects to the pending banner", async () => {
    prisma.user.create.mockResolvedValueOnce({ id: "u1" });
    await expect(
      registerAction({}, form({
        name: "New Person",
        email: "new@example.com",
        password: "password123",
        confirmPassword: "password123",
      })),
    ).rejects.toThrow("REDIRECT:/login?registered=pending");

    // No status passed → schema default (PENDING) applies; no session created.
    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(prisma.user.create.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("does not disclose an existing email (duplicate → same pending redirect)", async () => {
    prisma.user.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    await expect(
      registerAction({}, form({
        name: "Existing",
        email: "taken@example.com",
        password: "password123",
        confirmPassword: "password123",
      })),
    ).rejects.toThrow("REDIRECT:/login?registered=pending");
  });

  it("returns field errors for invalid input without touching the DB", async () => {
    const state = await registerAction({}, form({
      name: "x",
      email: "not-an-email",
      password: "short",
      confirmPassword: "nope",
    }));
    expect(state.fieldErrors).toBeTruthy();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rate-limits repeated registrations (per email)", async () => {
    rateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 3600 });
    const state = await registerAction({}, form({
      name: "New Person",
      email: "new@example.com",
      password: "password123",
      confirmPassword: "password123",
    }));
    expect(state.error).toMatch(/too many/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("loginAction", () => {
  const password = "password123";

  async function activeUser(overrides: Record<string, unknown> = {}) {
    return {
      id: "u1",
      name: "Jordan",
      email: "user@example.com",
      passwordHash: await bcrypt.hash(password, 10),
      status: "ACTIVE",
      tokenVersion: 0,
      ...overrides,
    };
  }

  it("signs in an ACTIVE member and redirects", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(await activeUser());
    await expect(
      loginAction({}, form({ email: "user@example.com", password, next: "/dashboard" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(createSession).toHaveBeenCalledOnce();
  });

  it("blocks a non-ACTIVE member with the status message and no session", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(await activeUser({ status: "SUSPENDED" }));
    const state = await loginAction({}, form({ email: "user@example.com", password }));
    expect(state.error).toMatch(/suspended/i);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects a wrong password generically", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(await activeUser());
    const state = await loginAction({}, form({ email: "user@example.com", password: "wrong" }));
    expect(state.error).toBe("Invalid email or password.");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns the same generic error for an unknown email (no enumeration)", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const state = await loginAction({}, form({ email: "nobody@example.com", password }));
    expect(state.error).toBe("Invalid email or password.");
  });

  it("rate-limits repeated FAILED attempts (per account, via peek gate)", async () => {
    peekRateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 60 });
    const state = await loginAction({}, form({ email: "user@example.com", password }));
    expect(state.error).toMatch(/too many/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("applies the per-IP cap after the per-account cap passes", async () => {
    peekRateLimit
      .mockReturnValueOnce({ ok: true, retryAfterSec: 0 }) // per-account passes
      .mockReturnValueOnce({ ok: false, retryAfterSec: 60 }); // per-IP trips
    const state = await loginAction({}, form({ email: "user@example.com", password }));
    expect(state.error).toMatch(/too many/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("counts a failed login (increments the limiter) but not a success", async () => {
    // Wrong password → counted.
    prisma.user.findUnique.mockResolvedValueOnce(await activeUser());
    await loginAction({}, form({ email: "user@example.com", password: "wrong" }));
    expect(rateLimit).toHaveBeenCalled();
    rateLimit.mockClear();
    // Correct password → NOT counted.
    prisma.user.findUnique.mockResolvedValueOnce(await activeUser());
    await expect(
      loginAction({}, form({ email: "user@example.com", password, next: "/dashboard" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(rateLimit).not.toHaveBeenCalled();
  });
});

describe("adminLoginAction", () => {
  const password = "superadmin1";

  it("signs in an admin against the Admin table and redirects to /admin", async () => {
    prisma.admin.findUnique.mockResolvedValueOnce({
      id: "a1",
      name: "Owner",
      email: "super@example.com",
      passwordHash: await bcrypt.hash(password, 10),
      role: "SUPER_ADMIN",
    });
    await expect(
      adminLoginAction({}, form({ email: "super@example.com", password })),
    ).rejects.toThrow("REDIRECT:/admin");
    expect(createAdminSession).toHaveBeenCalledOnce();
  });

  it("returns a generic error for an unknown admin email (no enumeration)", async () => {
    prisma.admin.findUnique.mockResolvedValueOnce(null);
    const state = await adminLoginAction({}, form({ email: "nobody@example.com", password }));
    expect(state.error).toBe("Invalid email or password.");
    expect(createAdminSession).not.toHaveBeenCalled();
  });

  it("counts a failed admin login on a wrong password (known admin)", async () => {
    prisma.admin.findUnique.mockResolvedValueOnce({
      id: "a1",
      name: "Owner",
      email: "super@example.com",
      passwordHash: await bcrypt.hash(password, 10),
      role: "SUPER_ADMIN",
    });
    const state = await adminLoginAction({}, form({ email: "super@example.com", password: "wrong" }));
    expect(state.error).toBe("Invalid email or password.");
    expect(createAdminSession).not.toHaveBeenCalled();
    expect(rateLimit).toHaveBeenCalled(); // failure counted
  });

  it("rate-limits repeated admin attempts (peek gate)", async () => {
    peekRateLimit.mockReturnValueOnce({ ok: false, retryAfterSec: 120 });
    const state = await adminLoginAction({}, form({ email: "super@example.com", password }));
    expect(state.error).toMatch(/too many/i);
    expect(prisma.admin.findUnique).not.toHaveBeenCalled();
  });
});

describe("logout actions", () => {
  it("logoutAction clears the member session and redirects home", async () => {
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");
    expect(destroySession).toHaveBeenCalledOnce();
  });

  it("adminLogoutAction clears the admin session and redirects to admin login", async () => {
    await expect(adminLogoutAction()).rejects.toThrow("REDIRECT:/admin/login");
    expect(destroyAdminSession).toHaveBeenCalledOnce();
  });
});

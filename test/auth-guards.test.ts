import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the collaborators; let @/lib/session run for real so tokens round-trip.
const { redirect, prisma, store } = vi.hoisted(() => ({
  redirect: vi.fn((u: string) => {
    throw new Error(`REDIRECT:${u}`);
  }),
  prisma: { user: { findUnique: vi.fn() }, admin: { findUnique: vi.fn() } },
  store: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import {
  requireUser,
  requireAdmin,
  requireSuperAdmin,
  getCurrentUser,
  getCurrentAdmin,
  createSession,
  destroySession,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth";
import {
  signSession,
  signAdminSession,
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/lib/session";

function setCookie(name: string, value: string) {
  store.get.mockImplementation((n: string) => (n === name ? { value } : undefined));
}

afterEach(() => vi.clearAllMocks());

describe("requireUser (fresh status re-check)", () => {
  it("redirects to login when not signed in", async () => {
    store.get.mockReturnValue(undefined);
    await expect(requireUser("/login?next=/submit")).rejects.toThrow(
      "REDIRECT:/login?next=/submit",
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns an ACTIVE member from the DB, not the token", async () => {
    setCookie(SESSION_COOKIE, await signSession({ id: "u1", name: "J", email: "j@x.com" }));
    prisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Fresh Name",
      email: "j@x.com",
      status: "ACTIVE",
    });
    await expect(requireUser()).resolves.toEqual({
      id: "u1",
      name: "Fresh Name",
      email: "j@x.com",
    });
  });

  it("cuts off a suspended member to /session/blocked", async () => {
    setCookie(SESSION_COOKIE, await signSession({ id: "u1", name: "J", email: "j@x.com" }));
    prisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "J",
      email: "j@x.com",
      status: "SUSPENDED",
    });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/session/blocked");
  });

  it("cuts off a member whose row was deleted", async () => {
    setCookie(SESSION_COOKIE, await signSession({ id: "u1", name: "J", email: "j@x.com" }));
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/session/blocked");
  });
});

describe("requireAdmin / requireSuperAdmin (fresh role re-check)", () => {
  it("redirects to admin login when not signed in", async () => {
    store.get.mockReturnValue(undefined);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?next=/admin");
  });

  it("cuts off a deleted admin to /session/admin-blocked", async () => {
    setCookie(
      ADMIN_SESSION_COOKIE,
      await signAdminSession({ id: "a1", name: "M", email: "m@x.com", role: "MODERATOR" }),
    );
    prisma.admin.findUnique.mockResolvedValueOnce(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/session/admin-blocked");
  });

  it("honours a demotion immediately (token says SUPER_ADMIN, DB says MODERATOR)", async () => {
    setCookie(
      ADMIN_SESSION_COOKIE,
      await signAdminSession({ id: "a1", name: "M", email: "m@x.com", role: "SUPER_ADMIN" }),
    );
    prisma.admin.findUnique.mockResolvedValue({
      id: "a1",
      name: "M",
      email: "m@x.com",
      role: "MODERATOR",
    });
    await expect(requireSuperAdmin()).rejects.toThrow("REDIRECT:/admin");
  });

  it("allows a current super admin", async () => {
    setCookie(
      ADMIN_SESSION_COOKIE,
      await signAdminSession({ id: "a2", name: "O", email: "o@x.com", role: "SUPER_ADMIN" }),
    );
    prisma.admin.findUnique.mockResolvedValue({
      id: "a2",
      name: "O",
      email: "o@x.com",
      role: "SUPER_ADMIN",
    });
    await expect(requireSuperAdmin()).resolves.toMatchObject({ role: "SUPER_ADMIN" });
  });
});

describe("getCurrentUser / getCurrentAdmin", () => {
  it("return null without a cookie", async () => {
    store.get.mockReturnValue(undefined);
    expect(await getCurrentUser()).toBeNull();
    expect(await getCurrentAdmin()).toBeNull();
  });

  it("getCurrentUser rejects an admin token (kind mismatch)", async () => {
    setCookie(
      SESSION_COOKIE,
      await signAdminSession({ id: "a1", name: "M", email: "m@x.com", role: "MODERATOR" }),
    );
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("session cookie helpers", () => {
  it("createSession sets the member cookie with a signed token", async () => {
    await createSession({ id: "u1", name: "J", email: "j@x.com" });
    expect(store.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });

  it("createAdminSession sets the admin cookie", async () => {
    await createAdminSession({ id: "a1", name: "M", email: "m@x.com", role: "MODERATOR" });
    expect(store.set).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("destroySession / destroyAdminSession clear their cookies", async () => {
    await destroySession();
    expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE);
    await destroyAdminSession();
    expect(store.delete).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE);
  });
});

import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import {
  signSession,
  signAdminSession,
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/lib/session";

let memberCookie: string;
let modCookie: string;
let superCookie: string;

beforeAll(async () => {
  memberCookie = await signSession({ id: "u1", name: "Jordan", email: "u@x.com", tokenVersion: 0 });
  modCookie = await signAdminSession({ id: "a1", name: "Mod", email: "m@x.com", role: "MODERATOR" });
  superCookie = await signAdminSession({ id: "a2", name: "Owner", email: "s@x.com", role: "SUPER_ADMIN" });
});

function makeReq(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest(new URL(`http://localhost${path}`), {
    headers: cookie ? { cookie } : undefined,
  });
}

function redirectPath(res: Response): string | null {
  const loc = res.headers.get("location");
  if (!loc) return null;
  const u = new URL(loc);
  return u.pathname + u.search;
}

describe("middleware", () => {
  it("lets the admin login page through (public)", async () => {
    expect(redirectPath(await middleware(makeReq("/admin/login")))).toBeNull();
  });

  it("sends an unauthenticated admin request to the admin login", async () => {
    expect(redirectPath(await middleware(makeReq("/admin")))).toBe(
      "/admin/login?next=%2Fadmin",
    );
  });

  it("never accepts a member cookie as an admin session", async () => {
    const res = await middleware(makeReq("/admin", { [SESSION_COOKIE]: memberCookie }));
    expect(redirectPath(res)).toBe("/admin/login?next=%2Fadmin");
  });

  it("lets a moderator into the console", async () => {
    const res = await middleware(makeReq("/admin", { [ADMIN_SESSION_COOKIE]: modCookie }));
    expect(redirectPath(res)).toBeNull();
  });

  it("blocks a moderator from a SUPER_ADMIN route", async () => {
    const res = await middleware(makeReq("/admin/admins", { [ADMIN_SESSION_COOKIE]: modCookie }));
    expect(redirectPath(res)).toBe("/admin");
  });

  it("lets a super admin into a SUPER_ADMIN route", async () => {
    const res = await middleware(makeReq("/admin/admins", { [ADMIN_SESSION_COOKIE]: superCookie }));
    expect(redirectPath(res)).toBeNull();
  });

  it("sends an unauthenticated member area to the member login", async () => {
    expect(redirectPath(await middleware(makeReq("/dashboard")))).toBe(
      "/login?next=%2Fdashboard",
    );
  });

  it("gates /account for unauthenticated members", async () => {
    expect(redirectPath(await middleware(makeReq("/account")))).toBe(
      "/login?next=%2Faccount",
    );
  });

  it("lets a signed-in member into /account", async () => {
    const res = await middleware(makeReq("/account", { [SESSION_COOKIE]: memberCookie }));
    expect(redirectPath(res)).toBeNull();
  });

  it("lets a signed-in member into a member area", async () => {
    const res = await middleware(makeReq("/submit", { [SESSION_COOKIE]: memberCookie }));
    expect(redirectPath(res)).toBeNull();
  });
});

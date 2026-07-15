import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifySession,
  verifyAdminSession,
} from "@/lib/session";

const ADMIN_PREFIX = "/admin";
const ADMIN_LOGIN = "/admin/login";
/** Admin routes that require the SUPER_ADMIN role (not just any admin). */
const SUPER_ADMIN_PREFIXES = ["/admin/admins"];
const USER_AUTH_REQUIRED = ["/submit", "/dashboard"];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin console — gated on the separate admin session.
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (pathname === ADMIN_LOGIN) return NextResponse.next(); // public

    const admin = await verifyAdminSession(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );
    if (!admin) {
      const url = new URL(ADMIN_LOGIN, request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (
      SUPER_ADMIN_PREFIXES.some((p) => matches(pathname, p)) &&
      admin.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Public member-only areas — gated on the user session.
  if (USER_AUTH_REQUIRED.some((p) => matches(pathname, p))) {
    const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/submit/:path*", "/dashboard/:path*"],
};

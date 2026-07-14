import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const ADMIN_PREFIX = "/admin";
const AUTH_REQUIRED = ["/submit", "/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const needsAuth =
    pathname.startsWith(ADMIN_PREFIX) ||
    AUTH_REQUIRED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsAuth && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith(ADMIN_PREFIX) && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/submit/:path*", "/dashboard/:path*"],
};

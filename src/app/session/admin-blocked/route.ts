import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

/**
 * Clears the admin session cookie and redirects to the admin login with a
 * "signed out" banner. `requireAdmin` redirects here when the admin row no
 * longer exists (deleted mid-session) — a Server Component can't clear cookies.
 * Only clears on a same-origin navigation so a cross-site request can't be used
 * to force-logout an admin.
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login?blocked=1", request.url));
  const site = request.headers.get("sec-fetch-site");
  if (site === null || site === "same-origin" || site === "none") {
    res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Clears the (now-inert) member session cookie and sends the user to the login
 * page with the "signed out" banner.
 *
 * `requireUser` redirects here when it finds a non-ACTIVE account: a Server
 * Component can't delete cookies, but a Route Handler can. Clearing the cookie
 * also keeps the header from showing a just-cut-off member as still signed in.
 * Only clears on a same-origin navigation, so a cross-site request (e.g. an
 * <img> tag) can't be used to force-logout a member.
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?blocked=1", request.url));
  const site = request.headers.get("sec-fetch-site");
  if (site === null || site === "same-origin" || site === "none") {
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}

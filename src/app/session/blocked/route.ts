import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Clears the (now-inert) member session cookie and sends the user to the login
 * page with the "signed out" banner.
 *
 * `requireUser` redirects here when it finds a non-ACTIVE account: a Server
 * Component can't delete cookies, but a Route Handler can. Clearing the cookie
 * also keeps the header from showing a just-cut-off member as still signed in.
 */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/login?blocked=1", request.url));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

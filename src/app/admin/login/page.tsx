import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeRedirect } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeRedirect(sp.next, "/admin");
  const blocked = sp.blocked === "1";
  const session = await getCurrentAdmin();
  if (session) {
    // Only bounce an admin whose row still exists; a deleted admin keeps a valid
    // cookie but must be able to reach the form (and see why they were signed out).
    const stillExists = await prisma.admin.findUnique({
      where: { id: session.id },
      select: { id: true },
    });
    if (stillExists) redirect(next);
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <Shield className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold">Agency console</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Staff sign in. This is separate from the public member account.
          </p>
        </div>

        {blocked && (
          <div role="status" className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            <p className="font-medium">You&apos;ve been signed out.</p>
            <p className="mt-0.5">
              Your admin access was changed. Sign in again if you still have
              access.
            </p>
          </div>
        )}

        <div className="card-surface p-6 sm:p-8">
          <AdminLoginForm next={next} />
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Demo admins (dev only)</p>
            <p>Super admin — super@modelhub.test / superadmin1</p>
            <p>Moderator — mod@modelhub.test / moderator1</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not staff?{" "}
          <Link href="/login" className="font-medium text-foreground link-underline">
            Member sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

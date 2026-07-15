import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { getCurrentAdmin } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeRedirect(sp.next, "/admin");
  const admin = await getCurrentAdmin();
  if (admin) redirect(next);

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

        <div className="card-surface p-6 sm:p-8">
          <AdminLoginForm next={next} />
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Demo admins</p>
          <p>Super admin — super@modelhub.test / superadmin1</p>
          <p>Moderator — mod@modelhub.test / moderator1</p>
        </div>

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

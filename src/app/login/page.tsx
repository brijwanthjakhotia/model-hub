import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeRedirect(sp.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-semibold">
              Muse<span className="text-accent">.</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to submit talent and leave reviews.
          </p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <LoginForm next={next} />
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Demo accounts</p>
          <p>Admin — admin@modelhub.test / admin1234</p>
          <p>User — user@modelhub.test / password123</p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-foreground link-underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

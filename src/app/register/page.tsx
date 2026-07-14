import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
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
          <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join Muse to submit talent and review models.
          </p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <RegisterForm next={next} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-foreground link-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

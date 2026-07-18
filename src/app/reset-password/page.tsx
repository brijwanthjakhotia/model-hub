import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawToken = sp.token;
  const token = typeof rawToken === "string" ? rawToken : "";

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
          <h1 className="mt-6 text-2xl font-semibold">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter a new password for your account.
          </p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4 text-center">
              <p
                role="alert"
                className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
              >
                This reset link is missing or invalid.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block text-sm font-medium text-foreground link-underline"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground link-underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

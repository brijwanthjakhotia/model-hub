import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = { title: "Account settings" };

export default async function AccountPage() {
  const session = await requireUser();
  const account = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, avatarUrl: true },
  });

  const defaults = {
    name: account?.name ?? session.name,
    email: account?.email ?? session.email,
    avatarUrl: account?.avatarUrl ?? "",
  };

  return (
    <div className="container max-w-2xl py-10 lg:py-14">
      <div>
        <span className="eyebrow">Your account</span>
        <h1 className="mt-2 text-4xl font-semibold">Account settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile details and password.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how you appear across Muse.
        </p>
        <div className="card-surface mt-4 p-6 sm:p-8">
          <ProfileForm defaults={defaults} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password you don&apos;t use elsewhere.
        </p>
        <div className="card-surface mt-4 p-6 sm:p-8">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}

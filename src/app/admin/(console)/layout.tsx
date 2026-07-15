import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { adminLogoutAction } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/ui/avatar";
import { getAdminStats } from "@/lib/queries";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  MODERATOR: "Moderator",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const stats = await getAdminStats();

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Agency console</span>
          <h1 className="mt-2 text-4xl font-semibold">Admin dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Review submissions, manage the roster and keep the gallery curated.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-border bg-muted/40 py-1.5 pl-1.5 pr-2">
          <Avatar name={admin.name} size={36} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{admin.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_LABEL[admin.role] ?? admin.role}
            </p>
          </div>
          <form action={adminLogoutAction}>
            <button
              type="submit"
              title="Sign out of the console"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10 focus-ring"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      <AdminNav
        pendingCount={stats.pending}
        pendingMembers={stats.pendingMembers}
        canManageAdmins={admin.role === "SUPER_ADMIN"}
      />

      <div className="mt-8">{children}</div>
    </div>
  );
}

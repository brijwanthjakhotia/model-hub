import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { deleteAdminAction } from "@/actions/admins";
import { prisma } from "@/lib/prisma";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ADMIN_ROLE_META } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admins" };

export default async function AdminsPage() {
  const current = await requireSuperAdmin();
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold">Console access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins sign in separately from public members. Roles determine what
          each admin can do:{" "}
          <span className="font-medium text-foreground">Moderators</span> review
          submissions and curate talent;{" "}
          <span className="font-medium text-foreground">Super admins</span> can
          also manage this list.
        </p>

        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center gap-3 p-4">
              <Avatar name={admin.name} src={admin.avatarUrl} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{admin.name}</p>
                  {admin.id === current.id && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {admin.email} · added {timeAgo(admin.createdAt)}
                </p>
              </div>
              <Badge tone={admin.role === "SUPER_ADMIN" ? "accent" : "muted"}>
                {ADMIN_ROLE_META[admin.role]?.label ?? admin.role}
              </Badge>
              {admin.id !== current.id && (
                <form action={deleteAdminAction}>
                  <input type="hidden" name="adminId" value={admin.id} />
                  <button
                    type="submit"
                    title={`Remove ${admin.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {admin.name}</span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Add an admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new console account. Share the temporary password securely and
          ask them to change it.
        </p>
        <div className="card-surface mt-5 p-6">
          <CreateAdminForm />
        </div>
      </section>
    </div>
  );
}

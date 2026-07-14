import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminStats } from "@/lib/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const stats = await getAdminStats();

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-6">
        <span className="eyebrow">Agency console</span>
        <h1 className="mt-2 text-4xl font-semibold">Admin dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Review submissions, manage the roster and keep the gallery curated.
        </p>
      </header>

      <AdminNav pendingCount={stats.pending} />

      <div className="mt-8">{children}</div>
    </div>
  );
}

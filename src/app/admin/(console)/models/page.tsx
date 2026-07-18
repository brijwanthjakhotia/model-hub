import type { Metadata } from "next";
import Link from "next/link";
import { getAllModelsForAdmin } from "@/lib/queries";
import { ModelImage } from "@/components/ui/model-image";
import { StatusBadge } from "@/components/ui/status-badge";
import { ModelRowActions } from "@/components/admin/model-row-actions";
import { formatDate } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Manage talent" };

export default async function AdminModelsPage() {
  // Page-level re-check (the layout guard doesn't re-run on soft navigations).
  await requireAdmin();
  const models = await getAllModelsForAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          All talent <span className="text-muted-foreground">({models.length})</span>
        </h2>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {models.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        <ModelImage name={m.name} src={m.headshotUrl} sizes="36px" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/models/${m.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {m.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.ratingCount > 0 ? `${m.ratingAvg.toFixed(1)} (${m.ratingCount})` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ModelRowActions
                      modelId={m.id}
                      featured={m.featured}
                      status={m.status}
                      name={m.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

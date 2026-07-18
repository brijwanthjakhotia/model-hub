import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ApprovalCard } from "@/components/admin/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getPendingModels, ADMIN_PAGE_SIZE, toPage } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Re-check at the page level: the (console) layout guard doesn't re-run on
  // soft client-side navigations, so a just-deleted admin must be cut off here.
  await requireAdmin();
  const sp = await searchParams;
  const page = toPage(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const { items: pending, total } = await getPendingModels(page);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Approval queue{" "}
          <span className="text-muted-foreground">({total})</span>
        </h2>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing to review"
          description="Every submission has been processed. New profiles will appear here for approval."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((m) => (
            <ApprovalCard key={m.id} model={m} />
          ))}
        </div>
      )}

      <Pagination
        basePath="/admin/approvals"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

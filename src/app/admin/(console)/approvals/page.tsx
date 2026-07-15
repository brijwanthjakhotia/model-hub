import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ApprovalCard } from "@/components/admin/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPendingModels } from "@/lib/queries";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const pending = await getPendingModels();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Approval queue{" "}
          <span className="text-muted-foreground">({pending.length})</span>
        </h2>
      </div>

      {pending.length === 0 ? (
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
    </div>
  );
}

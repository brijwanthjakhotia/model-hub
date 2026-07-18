import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ModelProfileView } from "@/components/models/model-profile-view";
import { ModelDecisionForm } from "@/components/admin/model-decision-form";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { StatusBadge } from "@/components/ui/status-badge";
import { getModelForAdmin } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile preview" };

export default async function AdminModelPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Page-level re-check (the layout guard doesn't re-run on soft navigations).
  await requireAdmin();
  const { id } = await params;
  const model = await getModelForAdmin(id);
  if (!model) notFound();

  const isPending = model.status === "PENDING";
  const backHref = isPending ? "/admin/approvals" : "/admin/models";
  const backLabel = isPending ? "Back to approval queue" : "Back to roster";

  const distribution = model.reviews.reduce<Record<number, number>>((acc, r) => {
    acc[r.rating] = (acc[r.rating] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Review context + inline decision */}
      <div className="card-surface mb-6 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={model.status} />
          <p className="text-sm text-muted-foreground">
            Submitted by{" "}
            <span className="font-medium text-foreground">
              {model.submittedBy?.name ?? "Unknown"}
            </span>{" "}
            ({model.submittedBy?.email ?? "—"}) · {formatDate(model.createdAt)}
          </p>
        </div>
        {isPending && (
          <ModelDecisionForm modelId={model.id} redirectTo="/admin/approvals" />
        )}
      </div>

      {model.status === "REJECTED" && model.reviewNote && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <p className="font-medium">
            Rejection note
            {model.reviewedBy?.name ? ` · ${model.reviewedBy.name}` : ""}
          </p>
          <p className="mt-0.5">{model.reviewNote}</p>
        </div>
      )}

      <ModelProfileView model={model} headingAs="h2" />

      {/* Reviews (read-only) */}
      {model.ratingCount > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="text-2xl font-semibold">
            Reviews{" "}
            <span className="text-muted-foreground">({model.ratingCount})</span>
          </h2>
          <div className="mt-6 max-w-3xl">
            <ReviewSummary
              average={model.ratingAvg}
              count={model.ratingCount}
              distribution={distribution}
            />
            <div className="mt-6">
              <ReviewList reviews={model.reviews} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

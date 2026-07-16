import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  FolderPlus,
  Plus,
  Star,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ModelImage } from "@/components/ui/model-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getUserSubmissions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My submissions" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const justSubmitted = sp.submitted === "1";
  const submissions = await getUserSubmissions(user.id);

  const counts = {
    total: submissions.length,
    approved: submissions.filter((m) => m.status === "APPROVED").length,
    pending: submissions.filter((m) => m.status === "PENDING").length,
  };

  return (
    <div className="container max-w-4xl py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Your account</span>
          <h1 className="mt-2 text-4xl font-semibold">My submissions</h1>
          <p className="mt-2 text-muted-foreground">
            Track the status of talent profiles you&apos;ve submitted.
          </p>
        </div>
        <ButtonLink href="/submit">
          <Plus className="h-4 w-4" />
          Submit talent
        </ButtonLink>
      </div>

      {justSubmitted && (
        <div role="status" className="mt-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            Your profile was submitted and is now awaiting admin review.
          </span>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <StatTile label="Submitted" value={counts.total} />
          <StatTile label="Approved" value={counts.approved} />
          <StatTile label="Pending" value={counts.pending} />
        </div>
      )}

      <div className="mt-8">
        {submissions.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No submissions yet"
            description="Submit your first talent profile to get it in front of casting directors."
            action={
              <ButtonLink href="/submit">
                <Plus className="h-4 w-4" />
                Submit talent
              </ButtonLink>
            }
          />
        ) : (
          <ul className="space-y-3">
            {submissions.map((m) => (
              <li
                key={m.id}
                className="card-surface flex items-center gap-4 p-3 sm:p-4"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ModelImage name={m.name} src={m.headshotUrl} sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{m.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.category} · {m.location}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {formatDate(m.createdAt)}
                    {m.status === "APPROVED" && m.ratingCount > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {m.ratingAvg.toFixed(1)} ({m.ratingCount})
                      </span>
                    )}
                  </p>
                  {m.status === "REJECTED" && m.reviewNote && (
                    <p className="mt-1.5 rounded-md bg-danger/10 px-2 py-1 text-xs text-danger">
                      Admin note: {m.reviewNote}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "APPROVED" && (
                    <Link
                      href={`/models/${m.slug}`}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View profile →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4 text-center">
      <p className="font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

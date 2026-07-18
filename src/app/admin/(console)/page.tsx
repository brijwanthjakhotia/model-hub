import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ModelImage } from "@/components/ui/model-image";
import { getAdminStats, getPendingModels } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  // Page-level re-check (the layout guard doesn't re-run on soft navigations).
  await requireAdmin();
  const [stats, { items: pending }] = await Promise.all([
    getAdminStats(),
    getPendingModels(), // first page; the overview only previews the top few
  ]);

  const cards = [
    { label: "Awaiting review", value: stats.pending, icon: Clock, tone: "text-warning" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-success" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, tone: "text-danger" },
    { label: "Total reviews", value: stats.reviews, icon: MessageSquare, tone: "text-accent" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <Icon className={`h-5 w-5 ${c.tone}`} />
              </div>
              <p className="mt-3 font-display text-4xl font-semibold">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pending approvals</h2>
            <p className="text-sm text-muted-foreground">
              {stats.pending} profile{stats.pending === 1 ? "" : "s"} waiting for
              a decision.
            </p>
          </div>
          {stats.pending > 0 && (
            <ButtonLink href="/admin/approvals" size="sm">
              Review queue
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )}
        </div>

        <div className="mt-5">
          {pending.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="There are no submissions waiting for review."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pending.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ModelImage name={m.name} src={m.headshotUrl} sizes="44px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.category} · by {m.submittedBy?.name ?? "Unknown"} ·{" "}
                      {timeAgo(m.createdAt)}
                    </p>
                  </div>
                  <Link
                    href="/admin/approvals"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Review →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-surface flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{stats.total} total profiles</p>
              <p className="text-sm text-muted-foreground">
                {stats.users} registered users
              </p>
            </div>
          </div>
          <ButtonLink href="/admin/models" variant="outline" size="sm">
            Manage
          </ButtonLink>
        </div>

        <div className="card-surface flex items-center justify-between p-5">
          <div>
            <p className="font-semibold">Public gallery</p>
            <p className="text-sm text-muted-foreground">
              {stats.approved} approved profiles live
            </p>
          </div>
          <ButtonLink href="/models" variant="outline" size="sm">
            View site
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

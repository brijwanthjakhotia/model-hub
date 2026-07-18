import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getMembers, getAdminStats, ADMIN_PAGE_SIZE, toPage } from "@/lib/queries";
import { MemberStatusControl } from "@/components/admin/member-status-control";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { USER_STATUS_META } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = toPage(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  // Pending count comes from the full-table stats, not the current page.
  const [{ items: members, total }, stats] = await Promise.all([
    getMembers(page),
    getAdminStats(),
  ]);
  const pending = stats.pendingMembers;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Public accounts. Only <span className="font-medium text-foreground">Active</span>{" "}
          members can sign in — new sign-ups start as <span className="font-medium text-foreground">Pending</span>{" "}
          and need approval.
          {pending > 0 && (
            <>
              {" "}
              <span className="font-medium text-warning">
                {pending} awaiting approval.
              </span>
            </>
          )}
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members yet" description="Registered members will appear here." />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {members.map((m) => {
            const meta = USER_STATUS_META[m.status];
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <Avatar name={m.name} src={m.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email} · joined {timeAgo(m.createdAt)} ·{" "}
                    {m._count.models} submitted · {m._count.reviews} reviews
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <MemberStatusControl userId={m.id} status={m.status} />
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        basePath="/admin/members"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

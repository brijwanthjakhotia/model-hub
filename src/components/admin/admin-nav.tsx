"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, ShieldCheck, UserCog, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const baseTabs = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/approvals", label: "Approvals", icon: ListChecks },
  { href: "/admin/models", label: "All talent", icon: Users },
  { href: "/admin/members", label: "Members", icon: UserCog },
];

export function AdminNav({
  pendingCount,
  pendingMembers = 0,
  canManageAdmins = false,
}: {
  pendingCount: number;
  pendingMembers?: number;
  canManageAdmins?: boolean;
}) {
  const pathname = usePathname();
  const tabs = canManageAdmins
    ? [...baseTabs, { href: "/admin/admins", label: "Admins", icon: ShieldCheck }]
    : baseTabs;

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            {tab.href === "/admin/approvals" && pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs text-warning-foreground">
                {pendingCount}
              </span>
            )}
            {tab.href === "/admin/members" && pendingMembers > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs text-warning-foreground">
                {pendingMembers}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

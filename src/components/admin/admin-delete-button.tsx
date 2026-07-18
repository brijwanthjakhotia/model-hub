"use client";

import { Trash2 } from "lucide-react";
import { deleteAdminAction } from "@/actions/admins";
import { PendingButton } from "@/components/ui/pending-button";

/** Delete-admin control with double-submit protection (avoids a second click
 *  hitting an already-deleted row → P2025 → error boundary). */
export function AdminDeleteButton({
  adminId,
  name,
}: {
  adminId: string;
  name: string;
}) {
  return (
    <form action={deleteAdminAction}>
      <input type="hidden" name="adminId" value={adminId} />
      <PendingButton
        title={`Remove ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove {name}</span>
      </PendingButton>
    </form>
  );
}

"use client";

import { updateMemberStatusAction } from "@/actions/members";
import { Select } from "@/components/ui/field";
import { USER_STATUSES, USER_STATUS_META } from "@/lib/constants";

/**
 * Compact status picker for a member row. Submits the server action as soon as
 * a new status is chosen; a visible button is kept for the no-JS case.
 */
export function MemberStatusControl({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  return (
    <form action={updateMemberStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="status"
        defaultValue={status}
        aria-label="Member status"
        className="h-9 py-0 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {USER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {USER_STATUS_META[s].label}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        Update
      </button>
    </form>
  );
}

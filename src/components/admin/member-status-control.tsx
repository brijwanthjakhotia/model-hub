"use client";

import { updateMemberStatusAction } from "@/actions/members";
import { Select } from "@/components/ui/field";
import {
  USER_STATUSES,
  USER_STATUS_META,
  type UserStatusValue,
} from "@/lib/constants";

/**
 * Status picker for a member row. Applying is an explicit button press — we do
 * NOT auto-submit on change, since a keyboard user arrowing through a focused
 * select would otherwise commit each status they pass over.
 */
export function MemberStatusControl({
  userId,
  status,
}: {
  userId: string;
  status: UserStatusValue;
}) {
  return (
    <form action={updateMemberStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="status"
        defaultValue={status}
        aria-label="Member status"
        className="h-9 py-0 text-xs"
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

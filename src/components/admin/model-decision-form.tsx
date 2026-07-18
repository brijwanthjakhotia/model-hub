"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { decideModelAction } from "@/actions/models";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/field";

/**
 * Approve / reject controls for a pending profile. Used both in the approvals
 * queue (inline, no redirect — the card drops out on revalidation) and on the
 * full-profile preview (with `redirectTo` back to the queue).
 */
export function ModelDecisionForm({
  modelId,
  redirectTo,
}: {
  modelId: string;
  redirectTo?: string;
}) {
  const [rejecting, setRejecting] = useState(false);

  if (rejecting) {
    return (
      <form action={decideModelAction} className="space-y-3">
        <input type="hidden" name="modelId" value={modelId} />
        <input type="hidden" name="decision" value="REJECTED" />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <Textarea
          name="note"
          placeholder="Reason for rejection (shared with the submitter)…"
          rows={2}
          required
          className="bg-card"
        />
        <div className="flex gap-2">
          <SubmitButton variant="danger" size="sm" pendingText="Rejecting…">
            <X className="h-4 w-4" />
            Confirm rejection
          </SubmitButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRejecting(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form action={decideModelAction}>
        <input type="hidden" name="modelId" value={modelId} />
        <input type="hidden" name="decision" value="APPROVED" />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <SubmitButton variant="primary" size="sm" pendingText="Approving…">
          <Check className="h-4 w-4" />
          Approve &amp; publish
        </SubmitButton>
      </form>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRejecting(true)}
      >
        <X className="h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}

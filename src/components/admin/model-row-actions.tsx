"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { deleteModelAction, toggleFeaturedAction } from "@/actions/models";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";
import type { ModelStatusValue } from "@/lib/constants";

export function ModelRowActions({
  modelId,
  featured,
  status,
  name,
}: {
  modelId: string;
  featured: boolean;
  status: ModelStatusValue;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      {status === "APPROVED" && (
        <form action={toggleFeaturedAction}>
          <input type="hidden" name="modelId" value={modelId} />
          <PendingButton
            title={featured ? "Remove from featured" : "Mark as featured"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted",
              featured ? "text-accent" : "text-muted-foreground",
            )}
          >
            <Star className={cn("h-4 w-4", featured && "fill-current")} />
            <span className="sr-only">
              {featured ? `Remove ${name} from featured` : `Mark ${name} as featured`}
            </span>
          </PendingButton>
        </form>
      )}

      {confirming ? (
        <form action={deleteModelAction} className="flex items-center gap-1">
          <input type="hidden" name="modelId" value={modelId} />
          <PendingButton className="rounded-lg bg-danger px-2 py-1 text-xs font-medium text-danger-foreground">
            Delete
          </PendingButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          title={`Delete ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete {name}</span>
        </button>
      )}
    </div>
  );
}

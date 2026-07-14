"use client";

import { useState } from "react";
import { Check, MapPin, Ruler, X } from "lucide-react";
import { decideModelAction } from "@/actions/models";
import { ModelImage } from "@/components/ui/model-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { parseGallery } from "@/lib/utils";

type PendingModel = {
  id: string;
  name: string;
  category: string;
  location: string;
  heightCm: number;
  experience: string;
  bio: string;
  headshotUrl: string | null;
  gallery: string;
  instagram: string | null;
  createdAt: Date;
  submittedBy: { name: string; email: string } | null;
};

export function ApprovalCard({ model }: { model: PendingModel }) {
  const [rejecting, setRejecting] = useState(false);
  const galleryCount = parseGallery(model.gallery).length;

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-44 sm:w-36">
          <ModelImage name={model.name} src={model.headshotUrl} sizes="144px" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold">{model.name}</h3>
            <Badge tone="accent">{model.category}</Badge>
            <Badge tone="outline">{model.experience}</Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {model.location}
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {model.heightCm} cm
            </span>
            <span>{galleryCount} portfolio image{galleryCount === 1 ? "" : "s"}</span>
          </div>

          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
            {model.bio}
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            Submitted by{" "}
            <span className="font-medium text-foreground">
              {model.submittedBy?.name ?? "Unknown"}
            </span>{" "}
            ({model.submittedBy?.email ?? "—"})
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 p-4 sm:px-5">
        {rejecting ? (
          <form action={decideModelAction} className="space-y-3">
            <input type="hidden" name="modelId" value={model.id} />
            <input type="hidden" name="decision" value="REJECTED" />
            <Textarea
              name="note"
              placeholder="Reason for rejection (shared with the submitter)…"
              rows={2}
              required
              className="bg-card"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" size="sm">
                <X className="h-4 w-4" />
                Confirm rejection
              </Button>
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
        ) : (
          <div className="flex flex-wrap gap-2">
            <form action={decideModelAction}>
              <input type="hidden" name="modelId" value={model.id} />
              <input type="hidden" name="decision" value="APPROVED" />
              <Button type="submit" variant="primary" size="sm">
                <Check className="h-4 w-4" />
                Approve &amp; publish
              </Button>
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
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Eye, MapPin, Ruler } from "lucide-react";
import { ModelImage } from "@/components/ui/model-image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ModelDecisionForm } from "@/components/admin/model-decision-form";
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
  const galleryCount = parseGallery(model.gallery).length;

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-44 sm:w-36">
          <ModelImage name={model.name} src={model.headshotUrl} sizes="144px" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/models/${model.id}`}
              className="font-display text-xl font-semibold hover:text-accent"
            >
              {model.name}
            </Link>
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Submitted by{" "}
              <span className="font-medium text-foreground">
                {model.submittedBy?.name ?? "Unknown"}
              </span>{" "}
              ({model.submittedBy?.email ?? "—"})
            </p>
            <ButtonLink href={`/admin/models/${model.id}`} variant="outline" size="sm">
              <Eye className="h-4 w-4" />
              View full profile
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 p-4 sm:px-5">
        <ModelDecisionForm modelId={model.id} />
      </div>
    </div>
  );
}

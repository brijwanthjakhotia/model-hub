import Link from "next/link";
import { MapPin, Ruler, Star } from "lucide-react";
import type { Model } from "@prisma/client";
import { ModelImage } from "@/components/ui/model-image";
import { Badge } from "@/components/ui/badge";

export function ModelCard({
  model,
  priority,
}: {
  model: Pick<
    Model,
    | "slug"
    | "name"
    | "headshotUrl"
    | "category"
    | "location"
    | "heightCm"
    | "ratingAvg"
    | "ratingCount"
    | "featured"
    | "experience"
  >;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/models/${model.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-ring"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ModelImage
            name={model.name}
            src={model.headshotUrl}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="default" className="bg-black/55 text-white backdrop-blur-sm">
            {model.category}
          </Badge>
          {model.featured && (
            <Badge tone="accent" className="bg-accent text-accent-foreground">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
        </div>

        {model.ratingCount > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {model.ratingAvg.toFixed(1)}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {model.name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/85">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {model.location}
            </span>
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {model.heightCm} cm
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

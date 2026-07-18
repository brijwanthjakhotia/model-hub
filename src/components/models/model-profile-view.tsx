import {
  Instagram,
  Mail,
  MapPin,
  Ruler,
  Sparkles,
} from "lucide-react";
import { ProfileGallery } from "@/components/models/profile-gallery";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { parseGallery } from "@/lib/utils";

/** Fields the profile presentation renders. Satisfied by both the public
 *  `getModelBySlug` read and the admin `getModelForAdmin` read. */
export type ProfileViewModel = {
  name: string;
  category: string;
  experience: string;
  location: string;
  heightCm: number;
  bio: string;
  featured: boolean;
  headshotUrl: string | null;
  gallery: string;
  instagram: string | null;
  agencyEmail: string | null;
  ratingAvg: number;
  ratingCount: number;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  shoeEu: number | null;
  hairColor: string | null;
  eyeColor: string | null;
};

/**
 * The gallery + details half of a model profile, shared by the public profile
 * page and the admin preview so the two never drift.
 */
export function ModelProfileView({
  model,
  headingAs: Heading = "h1",
}: {
  model: ProfileViewModel;
  /** The profile name's heading level. `h1` on the public page; `h2` where an
   *  ancestor already owns the page `h1` (e.g. the admin console layout). */
  headingAs?: "h1" | "h2";
}) {
  const galleryImages = [
    ...(model.headshotUrl ? [model.headshotUrl] : []),
    ...parseGallery(model.gallery),
  ];

  const measurements = [
    { label: "Height", value: `${model.heightCm} cm` },
    model.bust ? { label: "Bust", value: `${model.bust} cm` } : null,
    model.waist ? { label: "Waist", value: `${model.waist} cm` } : null,
    model.hips ? { label: "Hips", value: `${model.hips} cm` } : null,
    model.shoeEu ? { label: "Shoe (EU)", value: `${model.shoeEu}` } : null,
    model.hairColor ? { label: "Hair", value: model.hairColor } : null,
    model.eyeColor ? { label: "Eyes", value: model.eyeColor } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Left: gallery */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProfileGallery name={model.name} images={galleryImages} />
      </div>

      {/* Right: details */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{model.category}</Badge>
          {model.featured && (
            <Badge tone="default">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
          )}
          <Badge tone="outline">{model.experience}</Badge>
        </div>

        <Heading className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          {model.name}
        </Heading>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {model.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4" />
            {model.heightCm} cm
          </span>
          {model.ratingCount > 0 && (
            <span className="flex items-center gap-1.5">
              <RatingStars value={model.ratingAvg} size="sm" />
              <span className="font-medium text-foreground">
                {model.ratingAvg.toFixed(1)}
              </span>
              ({model.ratingCount})
            </span>
          )}
        </div>

        {/* Contact links */}
        {(model.instagram || model.agencyEmail) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {model.instagram && (
              <a
                href={`https://instagram.com/${model.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Instagram className="h-4 w-4" />
                @{model.instagram.replace(/^@/, "")}
              </a>
            )}
            {model.agencyEmail && (
              <a
                href={`mailto:${model.agencyEmail}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                Contact
              </a>
            )}
          </div>
        )}

        {/* Bio */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{model.bio}</p>
        </div>

        {/* Measurements */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Statistics</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {measurements.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-muted/40 px-4 py-3"
              >
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </dt>
                <dd className="mt-0.5 font-display text-lg font-semibold">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

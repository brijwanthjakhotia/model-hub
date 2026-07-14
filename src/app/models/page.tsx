import { Suspense } from "react";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { GalleryFiltersBar } from "@/components/models/filters";
import { ModelCard } from "@/components/models/model-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getApprovedModels } from "@/lib/queries";
import { pluralize } from "@/lib/utils";
import type { SortOption } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Talent Gallery",
  description: "Browse vetted modelling talent across every discipline.",
};

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    q: first(sp.q),
    category: first(sp.category),
    gender: first(sp.gender),
    experience: first(sp.experience),
    sort: (first(sp.sort) as SortOption) ?? "featured",
  };

  const models = await getApprovedModels(filters);

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8">
        <span className="eyebrow">The roster</span>
        <h1 className="mt-2 text-4xl font-semibold">Talent gallery</h1>
        <p className="mt-2 text-muted-foreground">
          {models.length} {pluralize(models.length, "profile")}
          {filters.category ? ` in ${filters.category}` : ""}
          {filters.q ? ` matching “${filters.q}”` : ""}
        </p>
      </header>

      <Suspense fallback={<div className="card-surface h-20" />}>
        <GalleryFiltersBar />
      </Suspense>

      <div className="mt-8">
        {models.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No talent matches your filters"
            description="Try broadening your search or clearing some filters to see more profiles."
            action={
              <ButtonLink href="/models" variant="outline">
                Reset filters
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {models.map((m, i) => (
              <ModelCard key={m.id} model={m} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

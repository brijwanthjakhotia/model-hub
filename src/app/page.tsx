import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ModelCard } from "@/components/models/model-card";
import { ModelImage } from "@/components/ui/model-image";
import {
  getCategoryCounts,
  getFeaturedModels,
  getSiteStats,
} from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";

export default async function HomePage() {
  const [featured, stats, categoryCounts] = await Promise.all([
    getFeaturedModels(4),
    getSiteStats(),
    getCategoryCounts(),
  ]);

  const heroImages = featured.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="eyebrow inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Curated modelling talent
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Where the next
              <span className="text-accent"> faces</span> are discovered
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Browse a hand-reviewed gallery of runway, commercial and editorial
              models. Every profile is vetted by our team before it goes live.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/models" size="lg">
                Explore talent
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/submit" variant="outline" size="lg">
                Submit a profile
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              <Stat value={`${stats.models}+`} label="Models" />
              <Stat value={`${stats.reviews}+`} label="Reviews" />
              <Stat value={`${stats.countries}`} label="Cities" />
            </dl>
          </div>

          {/* Image collage */}
          <div className="relative hidden h-[520px] lg:block">
            {heroImages[0] && (
              <div className="absolute left-0 top-6 h-80 w-56 overflow-hidden rounded-3xl border border-border shadow-lift">
                <ModelImage name={heroImages[0].name} src={heroImages[0].headshotUrl} priority sizes="224px" />
              </div>
            )}
            {heroImages[1] && (
              <div className="absolute right-4 top-0 h-64 w-48 overflow-hidden rounded-3xl border border-border shadow-lift">
                <ModelImage name={heroImages[1].name} src={heroImages[1].headshotUrl} priority sizes="192px" />
              </div>
            )}
            {heroImages[2] && (
              <div className="absolute bottom-0 right-16 h-72 w-52 overflow-hidden rounded-3xl border border-border shadow-lift">
                <ModelImage name={heroImages[2].name} src={heroImages[2].headshotUrl} sizes="208px" />
              </div>
            )}
            <div className="absolute bottom-10 left-2 flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-lift backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="text-sm">
                <p className="font-semibold leading-none">Vetted profiles</p>
                <p className="text-xs text-muted-foreground">Admin-approved talent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Handpicked</span>
            <h2 className="mt-2 text-3xl font-semibold">Featured talent</h2>
          </div>
          <Link
            href="/models"
            className="group hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:flex"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((m, i) => (
            <ModelCard key={m.id} model={m} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="container scroll-mt-20 py-16">
        <div className="text-center">
          <span className="eyebrow">Browse by discipline</span>
          <h2 className="mt-2 text-3xl font-semibold">Explore categories</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            From high-fashion runway to friendly commercial faces — find the
            right talent for every brief.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/models?category=${encodeURIComponent(c)}`}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lift"
            >
              <div>
                <p className="font-display text-lg font-semibold">{c}</p>
                <p className="text-sm text-muted-foreground">
                  {categoryCounts[c] ?? 0} {categoryCounts[c] === 1 ? "model" : "models"}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-muted/40 py-20">
        <div className="container">
          <div className="text-center">
            <span className="eyebrow">Simple &amp; transparent</span>
            <h2 className="mt-2 text-3xl font-semibold">How it works</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              icon={UploadCloud}
              step="01"
              title="Submit a profile"
              description="Create an account and submit talent details — stats, categories and portfolio images — in minutes."
            />
            <Step
              icon={ClipboardList}
              step="02"
              title="We review it"
              description="Our admin team vets every submission for quality and completeness before it appears in the gallery."
            />
            <Step
              icon={Star}
              step="03"
              title="Get discovered"
              description="Approved profiles go live for casting directors and clients to browse, rate and book."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-semibold sm:text-4xl">
            Ready to put your best face forward?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-primary-foreground/70">
            Join Muse and get your profile in front of the people who book the
            work.
          </p>
          <div className="relative mt-8 flex justify-center">
            <ButtonLink href="/register" variant="accent" size="lg">
              Create your account
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-3xl font-semibold">{value}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
    </div>
  );
}

function Step({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-7 shadow-soft">
      <span className="absolute right-6 top-6 font-display text-4xl font-semibold text-muted-foreground/15">
        {step}
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

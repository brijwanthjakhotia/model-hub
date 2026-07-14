import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">
              Muse<span className="text-accent">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A curated home for professional modelling talent — discover, review
            and represent the world&apos;s next faces.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/models" className="hover:text-foreground">All talent</Link></li>
            <li><Link href="/models?sort=top-rated" className="hover:text-foreground">Top rated</Link></li>
            <li><Link href="/models?sort=newest" className="hover:text-foreground">New faces</Link></li>
            <li><Link href="/submit" className="hover:text-foreground">Submit a profile</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Categories</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c}>
                <Link
                  href={`/models?category=${encodeURIComponent(c)}`}
                  className="hover:text-foreground"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Account</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link href="/register" className="hover:text-foreground">Create account</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">My submissions</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {2026} Muse Talent Hub. A demo project.</p>
          <p>Built with Next.js, Prisma &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}

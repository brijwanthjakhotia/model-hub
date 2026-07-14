import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="font-display text-7xl font-semibold text-accent">404</span>
      <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or the profile is no
        longer available.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <ButtonLink href="/models" variant="outline">
          Browse talent
        </ButtonLink>
      </div>
    </div>
  );
}

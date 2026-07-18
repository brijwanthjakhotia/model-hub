"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { ModelImage } from "@/components/ui/model-image";
import { cn } from "@/lib/utils";

export function ProfileGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  // Guarantee at least one slot so the fallback renders.
  const slides = images.length ? images : [""];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = (dir: number) =>
    setActive((i) => (i + dir + slides.length) % slides.length);

  // Close and return focus to the trigger that opened the viewer.
  const closeLightbox = () => {
    setLightbox(false);
    expandRef.current?.focus();
  };

  useEffect(() => {
    if (!lightbox) return;
    // Move focus into the dialog on open.
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, slides.length]);

  return (
    <div>
      <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
        <ModelImage
          name={name}
          src={slides[active] || null}
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
        {images.length > 0 && (
          <button
            ref={expandRef}
            onClick={() => setLightbox(true)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity focus-ring group-hover:opacity-100"
            aria-label="Expand image"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
        {slides.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {slides.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus-ring",
                i === active
                  ? "border-accent"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`View image ${i + 1}`}
            >
              <ModelImage name={name} src={src || null} sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — image viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            ref={closeRef}
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-ring"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[80vh] w-full max-w-md overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ModelImage name={name} src={slides[active] || null} sizes="90vw" />
            {slides.length > 1 && (
              <>
                <GalleryArrow side="left" onClick={() => go(-1)} />
                <GalleryArrow side="right" onClick={() => go(1)} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {active + 1} / {slides.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70 focus-ring",
        side === "left" ? "left-3" : "right-3",
      )}
      aria-label={side === "left" ? "Previous" : "Next"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

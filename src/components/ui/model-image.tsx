"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn, gradientFromString, initials } from "@/lib/utils";

/**
 * Portrait image for a model with a graceful gradient + initials fallback
 * when no headshot exists or the remote image fails to load.
 */
export function ModelImage({
  name,
  src,
  className,
  sizes,
  priority,
}: {
  name: string;
  src?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  // Reset the failed flag when the src changes — otherwise, in a reused instance
  // (e.g. the gallery viewer swapping slides), one broken image would force the
  // fallback for every subsequent image too.
  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={showImage ? undefined : { background: gradientFromString(name) }}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes ?? "(max-width: 768px) 50vw, 25vw"}
          className="object-cover"
          priority={priority}
          // Skip the Next optimizer for these images: they come from arbitrary,
          // user-supplied hosts, and the optimizer hard-errors (500 in dev) on
          // any host not in next.config remotePatterns. unoptimized renders a
          // plain <img>, so an unknown/broken host degrades to onError instead
          // of crashing the page (e.g. the admin approval queue).
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-4xl font-semibold text-white/90">
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  );
}

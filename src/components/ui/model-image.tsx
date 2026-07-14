"use client";

import { useState } from "react";
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

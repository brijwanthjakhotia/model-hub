"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn, gradientFromString, initials } from "@/lib/utils";

/** Small circular avatar with deterministic gradient + initials fallback. */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: gradientFromString(name),
      }}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          // See ModelImage: avatars are arbitrary user URLs; skip the optimizer
          // so an unknown host degrades to the initials fallback, not a crash.
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

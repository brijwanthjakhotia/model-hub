import Image from "next/image";
import { cn } from "@/lib/utils";
import { gradientFromString, initials } from "@/lib/utils";

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
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

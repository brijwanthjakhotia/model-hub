import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  error: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
} as const;

/**
 * Inline form feedback banner. Renders nothing when there's no message, so it
 * can be used unconditionally: `<FormMessage>{state.error}</FormMessage>`.
 */
export function FormMessage({
  tone = "error",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      // Errors interrupt (assertive); a success confirmation is polite.
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

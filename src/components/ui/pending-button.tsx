"use client";

import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A raw (unstyled-base) submit `<button>` that disables while its parent
 * `<form>` action is pending — for icon/select controls that aren't the pill
 * `Button`/`SubmitButton`. Optionally swaps its label to `pendingText`. Must be
 * rendered inside the `<form>`.
 */
export function PendingButton({
  className,
  title,
  pendingText,
  children,
}: {
  className?: string;
  title?: string;
  pendingText?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={cn(className, pending && "cursor-not-allowed opacity-50")}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

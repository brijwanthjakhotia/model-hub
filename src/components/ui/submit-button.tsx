"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * A submit button that disables itself while its parent `<form>` action is
 * pending, preventing double-submits. Must be rendered inside the `<form>`.
 */
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

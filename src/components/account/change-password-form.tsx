"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/actions/account";
import type { AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";

const initial: AuthState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the password fields once the change succeeds.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field
        label="Current password"
        htmlFor="currentPassword"
        required
        error={state.fieldErrors?.currentPassword}
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        required
        hint="At least 8 characters."
        error={state.fieldErrors?.newPassword}
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        required
        error={state.fieldErrors?.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <FormMessage>{state.error}</FormMessage>
      <FormMessage tone="success">{state.success}</FormMessage>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating…" : "Change password"}
    </Button>
  );
}

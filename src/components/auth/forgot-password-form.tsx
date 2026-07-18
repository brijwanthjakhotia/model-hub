"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/actions/password-reset";
import type { AuthState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";

const initial: AuthState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          required
        />
      </Field>

      <FormMessage>{state.error}</FormMessage>
      <FormMessage tone="success">{state.success}</FormMessage>

      <SubmitButton pendingText="Sending…" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}


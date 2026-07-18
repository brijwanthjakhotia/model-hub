"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/actions/account";
import type { AuthState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";

const initial: AuthState = {};

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string; avatarUrl: string };
}) {
  const [state, formAction] = useActionState(updateProfileAction, initial);
  const values = state.values ?? defaults;
  // Track the email field so we can ask for the current password only when the
  // email is actually being changed (the server requires it for an email change).
  const [email, setEmail] = useState(values.email);
  // Compare against the last *saved* email: after a successful change the layout
  // isn't re-rendered with new `defaults`, so use the just-saved value to avoid
  // demanding the password again on a later name-only save.
  const savedEmail = state.success && state.values?.email ? state.values.email : defaults.email;
  const emailChanged = email.trim().toLowerCase() !== savedEmail.toLowerCase();

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" htmlFor="name" required error={state.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={values.name}
          required
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values.email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field
        label="Avatar URL"
        htmlFor="avatarUrl"
        hint="Optional — a link to a square image."
        error={state.fieldErrors?.avatarUrl}
      >
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          placeholder="https://…"
          defaultValue={values.avatarUrl}
        />
      </Field>

      {emailChanged && (
        <Field
          label="Current password"
          htmlFor="currentPassword"
          required
          hint="Confirm your current password to change your email."
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
      )}

      <FormMessage>{state.error}</FormMessage>
      <FormMessage tone="success">{state.success}</FormMessage>

      <SubmitButton pendingText="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}


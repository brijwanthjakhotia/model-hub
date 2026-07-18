"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction } from "@/actions/account";
import type { AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
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
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

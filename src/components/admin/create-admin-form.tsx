"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAdminAction, type AdminFormState } from "@/actions/admins";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { ADMIN_ROLES, ADMIN_ROLE_META } from "@/lib/constants";

const initial: AdminFormState = {};

export function CreateAdminForm() {
  const [state, formAction] = useActionState(createAdminAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            placeholder="Jane Doe"
            defaultValue={state.values?.name}
            required
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@agency.com"
            defaultValue={state.values?.email}
            required
          />
        </Field>

        <Field
          label="Temporary password"
          htmlFor="password"
          required
          error={state.fieldErrors?.password}
          hint="At least 8 characters."
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </Field>

        <Field label="Role" htmlFor="role" required error={state.fieldErrors?.role}>
          <Select
            id="role"
            name="role"
            defaultValue={state.values?.role ?? "MODERATOR"}
            required
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ADMIN_ROLE_META[r].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

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
      {pending ? "Creating…" : "Create admin"}
    </Button>
  );
}

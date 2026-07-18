"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";

const initial: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

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

      <Field
        label="Password"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <div className="-mt-1 text-right">
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-muted-foreground link-underline hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>

      <FormMessage>{state.error}</FormMessage>

      <SubmitButton pendingText="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}


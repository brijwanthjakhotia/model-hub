/**
 * Shared shape returned by server actions to `useActionState` when there's
 * nothing to redirect to. `AuthState`, `AdminFormState` and `ModelFormState`
 * are aliases of this. (`ReviewState` deliberately differs — boolean `success`,
 * no `values`.)
 */
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

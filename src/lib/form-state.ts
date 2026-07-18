/**
 * Shared shape returned by server actions to `useActionState` when there's
 * nothing to redirect to. `AuthState`, `AdminFormState`, `ModelFormState` and
 * `ReviewState` are all aliases of this.
 */
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

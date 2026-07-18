/**
 * Message shown when a non-ACTIVE member tries to sign in. The two suspended
 * states share a message on purpose — we don't disclose a fraud flag.
 *
 * Lives outside the `"use server"` action module so it can be a plain (sync)
 * function and unit-tested.
 */
export function statusLoginMessage(status: string): string {
  switch (status) {
    case "PENDING":
      return "Your account is awaiting approval. You'll be able to sign in once an admin activates it.";
    case "INACTIVE":
      return "Your account is inactive. Please contact support to reactivate it.";
    default: // SUSPENDED, SUSPENDED_FRAUD
      return "Your account has been suspended. Please contact support.";
  }
}

/** Friendly "slow down" message for a tripped rate limit. */
export function tooManyMsg(retryAfterSec: number): string {
  const mins = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Too many attempts. Please try again in about ${mins} minute${mins === 1 ? "" : "s"}.`;
}

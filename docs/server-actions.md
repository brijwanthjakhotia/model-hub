# Server actions & queries

All writes are **Server Actions** (`"use server"`); all reads go through the
**query layer** (`server-only`). Both run inside the Next.js server runtime.

## Server actions

### Auth — [`src/actions/auth.ts`](../src/actions/auth.ts)

| Action | Signature | Auth | Validation | Effect |
| --- | --- | --- | --- | --- |
| `registerAction` | `(prev, formData) => AuthState` | public (rate-limited) | `registerSchema` | Creates a **`PENDING`** user; **does not** sign in; redirects to `/login?registered=pending`. A duplicate email yields the *same* redirect (no enumeration). |
| `loginAction` | `(prev, formData) => AuthState` | public (rate-limited) | `loginSchema` | Verifies **user** credentials with `bcrypt.compare` (constant-time on unknown email), then rejects unless `status == ACTIVE`; sets `mh_session`; redirects. Generic error on failure. |
| `logoutAction` | `() => void` | any | — | Clears `mh_session`; redirects to `/`. |
| `adminLoginAction` | `(prev, formData) => AuthState` | public (rate-limited) | `loginSchema` | Verifies credentials against the **`Admin`** table (constant-time on unknown email); sets `mh_admin`; redirects to `safeRedirect(next, "/admin")`. |
| `adminLogoutAction` | `() => void` | any | — | Clears `mh_admin`; redirects to `/admin/login`. |

### Admins — [`src/actions/admins.ts`](../src/actions/admins.ts)

| Action | Signature | Auth | Validation | Effect |
| --- | --- | --- | --- | --- |
| `createAdminAction` | `(prev, formData) => AdminFormState` | **super admin** | `createAdminSchema` | Rejects duplicate email; bcrypt-hashes password; creates an `Admin` with the chosen role; revalidates `/admin/admins`. |
| `deleteAdminAction` | `(formData) => void` | **super admin** | — | Removes an admin; refuses to delete yourself or the last super admin; revalidates `/admin/admins`. |

### Members — [`src/actions/members.ts`](../src/actions/members.ts)

| Action | Signature | Auth | Validation | Effect |
| --- | --- | --- | --- | --- |
| `updateMemberStatusAction` | `(formData) => void` | **admin** | `userStatusSchema` | Sets a member's `status` (e.g. `PENDING` → `ACTIVE`, or a suspend state); revalidates `/admin/members`. Gates future sign-ins. |

`AuthState = { error?, fieldErrors?, values? }` (and `AdminFormState`, which adds
`success?`) is returned to the form via `useActionState` when there's nothing to
redirect to.

### Models — [`src/actions/models.ts`](../src/actions/models.ts)

| Action | Signature | Auth | Validation | Effect |
| --- | --- | --- | --- | --- |
| `createModelAction` | `(prev, formData) => ModelFormState` | **active member** (`requireUser`, rate-limited per user) | `modelSchema` | Builds a unique slug, parses gallery URLs, creates a `PENDING` profile owned by the user; revalidates `/dashboard` & `/admin/approvals`; redirects to `/dashboard?submitted=1`. |
| `decideModelAction` | `(formData) => void` | **admin** | `reviewDecisionSchema` | Sets `status` to `APPROVED`/`REJECTED` with an optional note, stamps `reviewedById`/`reviewedAt`; revalidates admin pages & `/models`. |
| `toggleFeaturedAction` | `(formData) => void` | **admin** | — | Flips `featured`; revalidates `/`, `/models`, `/admin/models`. |
| `deleteModelAction` | `(formData) => void` | **admin** | — | Deletes the profile (reviews cascade); revalidates `/models` & `/admin/models`. |

### Reviews — [`src/actions/reviews.ts`](../src/actions/reviews.ts)

| Action | Signature | Auth | Validation | Effect |
| --- | --- | --- | --- | --- |
| `addReviewAction` | `(prev, formData) => ReviewState` | **active member** (`requireUser`, rate-limited per user) | `reviewSchema` | Auth-gates before revealing the target; enforces "model approved", "not your own profile", one-per-user; **upsert + rating-cache recompute run in one `$transaction`** so they can't diverge. Redirects anonymous users to login and blocks non-`ACTIVE` members. |

### Progressive enhancement

Because these are real Server Actions, the forms submit and work **without
client JavaScript**. Interactive forms additionally use `useActionState` (for
field errors / returned state) and `useFormStatus` (for pending button state).

## Query layer — [`src/lib/queries.ts`](../src/lib/queries.ts)

Read-only, `server-only`, called directly from Server Components.

| Function | Returns | Used by |
| --- | --- | --- |
| `getApprovedModels(filters)` | approved models matching search/category/gender/experience, sorted | Gallery |
| `getFeaturedModels(take)` | featured approved models | Landing, hero |
| `getModelBySlug(slug)` | one model + reviews (with authors) + submitter | Profile page |
| `getCategoryCounts()` | `{ [category]: count }` of approved models | Landing categories |
| `getPendingModels()` | pending models + submitter info | Admin approvals/overview |
| `getAllModelsForAdmin()` | every model (newest first) | Admin roster |
| `getUserSubmissions(userId)` | a user's own submissions | User dashboard |
| `getMembers()` | every member + status + submission/review counts | Admin members |
| `getAdminStats()` | totals by status + review/user counts + `pendingMembers` | Admin overview/layout |
| `getSiteStats()` | approved count, review count, distinct cities | Landing stats |

## Revalidation strategy

Mutations call `revalidatePath(...)` for every route whose cached render is
affected (e.g. approving a model revalidates `/admin/approvals`, `/admin` and
`/models`). Combined with server-rendered pages, this keeps the UI consistent
immediately after a write without manual client refetching.

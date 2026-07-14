# Features

End-to-end walkthroughs of each feature, with the routes and files involved.

## 1. Model gallery

**Route:** `/models` · **Files:** [`app/models/page.tsx`](../src/app/models/page.tsx),
[`components/models/filters.tsx`](../src/components/models/filters.tsx),
[`components/models/model-card.tsx`](../src/components/models/model-card.tsx),
[`lib/queries.ts`](../src/lib/queries.ts)

- A responsive grid of approved profiles rendered on the server.
- **Filters** (client component): free-text search, plus category, gender,
  experience and sort (`featured` / `top-rated` / `newest` / `name`).
- All filter state lives in the **URL query string**, so any filtered view is
  shareable and bookmarkable. The search box is debounced (350 ms) and updates
  the URL with `router.replace`; the server component re-queries and re-renders.
- Empty results show a friendly `EmptyState` with a reset link.

Query building happens in `getApprovedModels(filters)`, which composes a Prisma
`where` clause (search across name/location/bio/category) and an `orderBy` from
the sort option.

## 2. Model profile

**Route:** `/models/[slug]` · **Files:**
[`app/models/[slug]/page.tsx`](../src/app/models/[slug]/page.tsx),
[`components/models/profile-gallery.tsx`](../src/components/models/profile-gallery.tsx),
`components/reviews/*`

- **Portfolio gallery** with thumbnail strip and a keyboard-navigable lightbox
  (← / → / Esc). The headshot leads, followed by the parsed `gallery` images.
- **Statistics** grid rendered from whichever measurements are present.
- **Contact links** (Instagram, email) when provided.
- **Reviews** section: rating summary with a star-distribution bar, the review
  list, and a context-aware review panel (see next).
- `generateMetadata` produces per-profile `<title>`/description for SEO.
- Non-approved or unknown slugs return the 404 page.

## 3. Ratings & reviews

**Files:** [`actions/reviews.ts`](../src/actions/reviews.ts),
[`components/reviews/review-form.tsx`](../src/components/reviews/review-form.tsx),
`review-list.tsx`, `review-summary.tsx`

- Signed-in users leave a **1–5★ review** with an optional title and a body.
- **One review per user per model** (`@@unique([modelId, authorId])`);
  submitting again **updates** the existing one (`upsert`).
- Writing a review **recomputes** the model's `ratingAvg`/`ratingCount`.
- Business rules enforced in the action:
  - must be signed in (otherwise redirected to login with a `next` back to the
    profile);
  - the model must be `APPROVED`;
  - you **cannot review a profile you submitted**.
- The review panel adapts: sign-in prompt (anonymous), "you can't review your own
  profile" (owner), or the form (everyone else, pre-noting if you've already
  reviewed).

## 4. Submit talent

**Route:** `/submit` (auth required) · **Files:**
[`app/submit/page.tsx`](../src/app/submit/page.tsx),
[`components/models/submit-form.tsx`](../src/components/models/submit-form.tsx),
`createModelAction` in [`actions/models.ts`](../src/actions/models.ts)

- A multi-section form (Basics / Measurements / Media & links) validated by
  `modelSchema` (Zod). Optional measurements may be left blank.
- Portfolio images are entered as URLs (one per line); `parseGalleryUrls` keeps
  only valid http(s) URLs and caps the count at 12.
- A **unique slug** is generated from the name (`amara-nkosi`, `amara-nkosi-2`, …).
- New submissions are created with status **`PENDING`** and attributed to the
  submitter, then the user is redirected to their dashboard with a success note.

## 5. My submissions (user dashboard)

**Route:** `/dashboard` (auth required) · **File:**
[`app/dashboard/page.tsx`](../src/app/dashboard/page.tsx)

- Lists the current user's submissions with status badges and quick stats.
- Shows the **admin's rejection note** on rejected profiles, and a link to the
  live profile once approved.

## 6. Admin approval workflow

**Routes:** `/admin`, `/admin/approvals`, `/admin/models` (admin required)
**Files:** [`app/admin/*`](../src/app/admin), `components/admin/*`,
`decideModelAction` / `toggleFeaturedAction` / `deleteModelAction` in
[`actions/models.ts`](../src/actions/models.ts)

The headline feature. The admin console (guarded by `requireAdmin` in the admin
layout) has three tabs:

- **Overview** — stat cards (pending / approved / rejected / reviews) and a
  preview of the pending queue.
- **Approvals** — the pending queue. Each `ApprovalCard` shows the submission and
  offers **Approve & publish** or **Reject** (which reveals a required note field
  shared back to the submitter). A decision sets `status`, `reviewNote`,
  `reviewedById` and `reviewedAt`, then revalidates the affected pages.
- **All talent** — a roster table of every profile with status, rating, a
  **feature toggle** (approved profiles only) and **delete** (with inline
  confirm).

```mermaid
stateDiagram-v2
  [*] --> PENDING: user submits
  PENDING --> APPROVED: admin approves
  PENDING --> REJECTED: admin rejects (+ note)
  APPROVED --> [*]: visible in gallery
  REJECTED --> [*]: hidden; note shown to submitter
```

Only `APPROVED` profiles appear in the public gallery and are eligible for
reviews.

## 7. Theming & polish

- Light/dark theme with no flash of the wrong theme (boot script in the root
  layout) and a persisted toggle.
- Graceful image fallback: if a headshot/portfolio image is missing or fails to
  load, `ModelImage` renders a deterministic gradient with the model's initials,
  so layouts never break offline.
- Editorial typography (Playfair Display headings + Inter body) via `next/font`.

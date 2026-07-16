# Testing

Unit and component tests run on **Vitest** with **Testing Library** for the
React components. The suite focuses on the pure, dependency-light logic in the
`lib` layer plus a few presentational components — the code most worth locking
down with fast, deterministic tests.

## Tooling

| Tool | Purpose |
| --- | --- |
| [Vitest](https://vitest.dev) | Test runner (Vite-powered, native ESM/TS) |
| `@testing-library/react` + `@testing-library/dom` | Render & query React components |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, …) |
| `jsdom` | DOM implementation for component tests |
| `@vitest/coverage-v8` | Coverage via V8 |

Configuration is in [`vitest.config.mts`](../vitest.config.mts):

- Default environment is **node**; the `@` alias maps to `src/`, and
  `server-only` is aliased to a stub so server modules import cleanly.
- `AUTH_SECRET` is injected via `test.env` so session tests are reproducible.
- `esbuild.jsx: "automatic"` lets `.tsx` tests skip an explicit React import.
- Coverage spans `src/lib/**`, `src/actions/**` and `src/middleware.ts`, so the
  number reflects the security-critical surface — not just pure helpers. Only
  the Prisma client singleton (`lib/prisma.ts`) and the read/query layer
  (`lib/queries.ts`, pure query shapes) are excluded.
- [`test/setup.ts`](../test/setup.ts) registers the jest-dom matchers.

## Commands

```bash
npm test              # run once (CI mode)
npm run test:watch    # watch mode
npm run test:coverage # run with a coverage report (text + HTML in coverage/)
```

## Structure

```
test/
├── setup.ts                       # jest-dom matcher registration
├── stubs/server-only.ts           # no-op stub for the `server-only` package
├── utils.test.ts                  # pure helpers
├── validations.test.ts            # Zod schemas
├── session.test.ts                # JWT sign/verify (real jose crypto)
├── auth-messages.test.ts          # status → login-message mapping
├── rate-limit.test.ts             # window/eviction logic + clientIp trust
├── auth-guards.test.ts            # requireUser/requireAdmin/requireSuperAdmin
├── middleware.test.ts             # route gating (real tokens)
├── actions-auth.test.ts           # register / login / admin-login
├── actions-admins.test.ts         # create / delete admin
├── actions-members.test.ts        # member status changes
├── actions-models.test.ts         # create / decide / feature / delete
├── actions-reviews.test.ts        # review upsert + rating recompute
└── components/
    └── ui-components.test.tsx      # RatingStars, StatusBadge, Badge (jsdom)
```

Node is the default environment. Component test files opt into a DOM by adding a
docblock at the very top of the file:

```tsx
// @vitest-environment jsdom
```

## Coverage

Current suite: **150+ tests**. Coverage is measured across the security-critical
surface — the `lib` layer, **every server action**, and the **middleware** — not
just the pure helpers, so the headline number reflects reality (roughly **95%
lines / ~86% branch**). `session.ts`, `constants.ts`, `utils.ts`,
`validations.ts`, `auth-messages.ts` and `middleware.ts` sit at 100%; the
remainder is cookie setters and the header-parsing half of `rate-limit.ts`.
Run `npm run test:coverage` for the exact, current per-file table.

### What's covered

- **`utils.ts`** — `slugify`, `initials`, `gradientFromString` (determinism),
  `parseGallery`, `parseGalleryUrls`, `pluralize`, `formatDate`, `timeAgo` (with
  a fixed clock, Date + ISO-string), and `safeRedirect` (the open-redirect guard:
  protocol-relative, backslash, **control-char**, external-URL and non-string
  rejection).
- **`auth-messages.ts`** — `statusLoginMessage` for each non-ACTIVE status,
  including that the two suspended states share a message (no fraud disclosure).
- **`validations.ts`** — every schema: password matching, email normalisation,
  measurement coercion and range checks, enum rejection, review bounds, and the
  admin decision enum.
- **`session.ts`** — sign/verify round-trip, and `null` for missing / malformed /
  expired / wrong-secret / wrong-shape tokens, plus the "missing `AUTH_SECRET`"
  error path; and cross-principal rejection (an admin token is never a member
  session, and vice-versa via the `kind` claim).
- **`rate-limit.ts`** — `rateLimit` window logic (allow N / block N+1, reset,
  `retryAfterSec`, independent keys, memory-bound eviction) via an injectable
  `now`; and that `clientIp` ignores a spoofable `X-Forwarded-For` without a
  configured trusted proxy.
- **`middleware.ts`** — public admin-login pass-through; member cookie never
  accepted as admin; moderator vs SUPER_ADMIN route gating; member-area gating.
- **Auth guards** (`auth-guards`) — with mocked cookies/prisma and *real* token
  signing: `requireUser` returns the fresh DB record and cuts off a
  suspended/deleted member (`/session/blocked`); `requireAdmin` cuts off a
  deleted admin (`/session/admin-blocked`); `requireSuperAdmin` honours a
  demotion immediately; the cookie set/clear helpers.
- **Server actions** (`actions-auth`, `-admins`, `-members`, `-models`,
  `-reviews`) — with a mocked Prisma: register creates a PENDING user without a
  session and doesn't disclose a duplicate email; login/admin-login gate,
  reject generically and rate-limit; `deleteAdminAction` clears reviewer
  metadata and rolls back on the last super admin; `createModelAction` retries
  the slug on collision; `addReviewAction` authenticates before disclosure,
  blocks self-review, and writes+recomputes in one transaction; P2025 mapping.
- **Components** — `RatingStars` fill math, `StatusBadge` labels, `Badge` tones.

## What is intentionally not measured

`lib/queries.ts` (pure Prisma query shapes, no branching) and the Prisma client
singleton are excluded and exercised through **end-to-end verification** instead
(login sets a cookie and redirects; a suspended member / deleted admin is cut off
on the next request; approving a pending model flips its status). `clientIp`'s
trusted-proxy branch and the cookie setters lean on the Next.js request context;
the rest of that surface is now unit-tested with light mocks.

## A bug the tests caught

While writing `validations.test.ts`, the optional measurement fields (`bust`,
`waist`, `hips`, `shoeEu`) were found to reject **blank** form values: an empty
string coerced to `0` and failed the `min()` check, which would have blocked
legitimate submissions that omit optional measurements. The schema was fixed to
preprocess empty values to `undefined`, and a regression test now guards it
(`"treats blank optional measurements as undefined"`).

## Adding a test

1. Create `test/<name>.test.ts` (or `.tsx` + the jsdom docblock for components).
2. Import from `@/...` — the alias is configured.
3. Import `describe/it/expect` from `vitest` (globals are off by design).
4. Keep units pure where possible; for time-dependent code use
   `vi.useFakeTimers()` + `vi.setSystemTime()` as in `utils.test.ts`.

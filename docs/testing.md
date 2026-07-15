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

- Default environment is **node**; the `@` alias maps to `src/`.
- `AUTH_SECRET` is injected via `test.env` so session tests are reproducible.
- `esbuild.jsx: "automatic"` lets `.tsx` tests skip an explicit React import.
- Coverage is scoped to `src/lib/**` (excluding the `server-only`
  `prisma`/`auth`/`queries` modules, which are integration concerns).
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
├── utils.test.ts                  # pure helpers
├── validations.test.ts            # Zod schemas
├── session.test.ts                # JWT sign/verify (real jose crypto)
└── components/
    └── ui-components.test.tsx      # RatingStars, StatusBadge, Badge (jsdom)
```

Node is the default environment. Component test files opt into a DOM by adding a
docblock at the very top of the file:

```tsx
// @vitest-environment jsdom
```

## Coverage

Current suite: **93 tests** across 7 files, with **100% statement / branch /
function / line coverage** of the tested `lib` modules.

```
File              | % Stmts | % Branch | % Funcs | % Lines
------------------|---------|----------|---------|--------
All files         |     100 |      100 |     100 |     100
 auth-messages.ts |     100 |      100 |     100 |     100
 constants.ts     |     100 |      100 |     100 |     100
 session.ts       |     100 |      100 |     100 |     100
 utils.ts         |     100 |      100 |     100 |     100
 validations.ts   |     100 |      100 |     100 |     100
```

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
- **Server actions** (`actions-auth`, `actions-admins`) — with a mocked Prisma:
  `registerAction` creates a PENDING user without a session and doesn't disclose
  a duplicate email; `loginAction` gates on ACTIVE, rejects bad credentials
  generically, and rate-limits; `deleteAdminAction` blocks self-delete and the
  last super admin.
- **Components** — `RatingStars` fill math (including fractional and clamped
  values), `StatusBadge` labels, and `Badge` tone classes.

## What is intentionally not unit-tested

`lib/auth.ts`, `lib/queries.ts`, `lib/rate-limit.ts` and `middleware.ts` depend
on the Next.js request context (`cookies()`, `headers()`, `redirect()`), the
database, and `server-only`, so they are exercised through **end-to-end
verification** instead (login sets a cookie and redirects; a suspended member /
deleted admin is cut off on the next request; approving a pending model flips its
status). This keeps the unit suite fast and free of brittle mocks.

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

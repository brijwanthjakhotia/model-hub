# Muse — Talent Model Hub

A polished, responsive platform for listing and managing modelling talent. Muse
lets anyone browse a curated gallery of vetted models, view rich editorial
profiles, leave ratings & reviews, and submit new talent — while admins review
and approve every submission before it goes live.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Prisma** + **SQLite**, and a lightweight JWT session auth layer.

---

## Features

- **Model gallery** — responsive grid with live search, and filters by category,
  gender, experience and sort (featured / top-rated / newest / name). Filter
  state lives in the URL, so views are shareable.
- **Editorial profiles** — portrait gallery with lightbox, full stats/measurements,
  bio, contact links, and a reviews section with a rating distribution.
- **Ratings & reviews** — signed-in users leave a 1–5★ review (one per model,
  editable); the model's average rating is kept in sync automatically.
- **Submission flow** — a multi-section form to submit new talent; submissions
  start as `PENDING`.
- **Account settings & security** — signed-in members manage their profile
  (name, email, avatar) and change their password from **Account settings**; a
  **forgot-password** flow emails a single-use, 1-hour reset link. Only the
  SHA-256 hash of each reset token is stored.
- **Admin approval workflow** — an admin console with an overview dashboard,
  an approval queue (approve / reject with a note), a full-profile **preview**
  of any submission before deciding, and a full roster table (feature toggle,
  delete).
- **Separate admin auth** — agency staff live in their own `Admin` table with a
  dedicated `/admin/login` and their own session cookie, fully isolated from
  public member accounts. Admin roles (`SUPER_ADMIN`, `MODERATOR`) are enforced
  by middleware and server-side guards.
- **Member lifecycle** — members carry a status (`PENDING`, `ACTIVE`,
  `INACTIVE`, `SUSPENDED_FRAUD`, `SUSPENDED`); **only `ACTIVE` members can sign
  in**. New sign-ups start `PENDING` and are approved from an admin Members
  console.
- **Light / dark theme** with no flash-of-wrong-theme, elegant fashion-agency
  typography (Playfair Display + Inter), and graceful image fallbacks.

## Tech stack

| Concern       | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js 15 (App Router, Server Actions)             |
| Language      | TypeScript                                          |
| Styling       | Tailwind CSS + CSS variables (light/dark)           |
| Database      | SQLite via Prisma ORM                               |
| Auth          | `jose` JWT sessions in httpOnly cookies + `bcryptjs`|
| Validation    | Zod                                                 |
| Icons         | lucide-react                                        |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create the SQLite database and seed demo data
npm run db:push
npm run db:seed

# 3. Run the dev server
npm run dev
```

Then open <http://localhost:3000>.

> The `.env` file ships with a working `DATABASE_URL` and a development
> `AUTH_SECRET`. Replace `AUTH_SECRET` with a strong value before deploying
> (`openssl rand -base64 32`).

> **Email (password reset).** The forgot-password flow sends a reset link by
> email. Configure SMTP via the `SMTP_*` / `MAIL_FROM` variables in `.env` to
> send real mail. If `SMTP_HOST` is left unset (the default for local dev), the
> email — including the reset link — is **printed to the server console**
> instead, so you can test the whole flow with no mail server.

### Demo accounts

Admins sign in at `/admin/login`; members sign in at `/login`.

| Kind                     | Email                      | Password       |
| ------------------------ | -------------------------- | -------------- |
| Admin · super            | `super@modelhub.test`      | `superadmin1`  |
| Admin · moderator        | `mod@modelhub.test`        | `moderator1`   |
| Member · active          | `user@modelhub.test`       | `password123`  |
| Member · pending (blocked)| `pending@modelhub.test`   | `password123`  |
| Member · suspended (blocked)| `suspended@modelhub.test`| `password123` |

Sign in as an admin to access the console at `/admin` and work the approval
queue (3 profiles start pending). The **Members** tab lists all members and lets
any admin change status (e.g. approve a pending member so they can sign in); the
**super admin** additionally sees an **Admins** tab to create and remove console
accounts. Only the `ACTIVE` member above can sign in — the others are blocked by
the login gate.

## Useful scripts

| Script            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the dev server                               |
| `npm run build`   | Production build (`prisma generate` + `next build`)|
| `npm run start`   | Start the production server                         |
| `npm run typecheck` | Type-check with `tsc --noEmit`                    |
| `npm run lint`    | Lint with ESLint (`next/core-web-vitals`)          |
| `npm run db:push` | Sync the Prisma schema to SQLite (quick prototyping)|
| `npm run db:migrate` | Create + apply a migration (`prisma migrate dev`)|
| `npm run db:deploy` | Apply migrations in production (`migrate deploy`) |
| `npm run db:seed` | Seed users, models and reviews                     |
| `npm run db:reset`| Reset the DB, re-apply migrations, and re-seed     |
| `npm run db:studio` | Open Prisma Studio                               |
| `npm test`        | Run the unit/component test suite                  |
| `npm run test:watch` | Run tests in watch mode                         |
| `npm run test:coverage` | Run tests with a coverage report             |

## Testing

Unit and component tests run on **Vitest** + **Testing Library**:

```bash
npm test              # run once
npm run test:coverage # with coverage report
```

The suite has **200+ tests** covering the `lib` layer (utilities, Zod validation,
JWT session crypto, rate limiter, mailer), the **server actions** (auth, account,
password reset, models, reviews, members, admins), the auth **guards** and the
**middleware** — ~95% line / ~84% branch coverage across that measured surface —
plus component tests. See [docs/testing.md](docs/testing.md) for details.

Continuous integration runs `typecheck → lint → test → build` on every push/PR
(see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Documentation

Detailed technical docs live in [`docs/`](docs/README.md):

- [Architecture](docs/architecture.md) — stack, rendering model, layout, design decisions
- [Data model](docs/data-model.md) — schema, relations, the rating cache
- [Authentication](docs/authentication.md) — sessions, cookies, middleware, roles
- [Features](docs/features.md) — gallery, profiles, reviews, submission, approval workflow
- [Server actions & queries](docs/server-actions.md) — every mutation and read
- [Testing](docs/testing.md) — tooling, coverage, how to add tests

## Project structure

```
src/
├── app/                 # Routes (App Router)
│   ├── page.tsx         # Landing page
│   ├── models/          # Gallery + [slug] profile
│   ├── submit/          # Submit-talent form
│   ├── login, register/ # Auth pages
│   ├── dashboard/       # A user's own submissions
│   └── admin/           # Console: overview, approvals, roster
├── actions/             # Server actions (auth, models, reviews)
├── components/          # UI primitives, layout, models, reviews, admin
├── lib/                 # prisma, auth/session, queries, validations, utils
└── middleware.ts        # Route protection for /admin, /submit, /dashboard
prisma/
├── schema.prisma        # User, Admin, Model, Review
└── seed.ts              # Demo data
```

## Data model

- **User** — public member: `name`, `email`, `passwordHash`, `status`
  (`PENDING` | `ACTIVE` | `INACTIVE` | `SUSPENDED_FRAUD` | `SUSPENDED`). No role.
- **Admin** — agency staff (separate table): `name`, `email`, `passwordHash`,
  `role` (`SUPER_ADMIN` | `MODERATOR`).
- **Model** — profile fields, physical stats, portfolio gallery (JSON), a
  denormalised rating cache, and approval metadata (`status`, `reviewNote`,
  `reviewedBy`, `submittedBy`).
- **Review** — `rating` (1–5), `title`, `body`; unique per (model, author).

## Notes

- Demo images are pulled from `picsum.photos`; if an image fails to load (e.g.
  offline) the UI falls back to a deterministic gradient with the model's
  initials, so the layout never breaks.
- This is a demo project — the committed `.env` secret is for local use only.

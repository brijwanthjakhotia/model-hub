# Muse — Documentation

Detailed technical documentation for the **Muse Talent Model Hub**. For a quick
start, see the root [README](../README.md).

## Table of contents

| Document | What's inside |
| --- | --- |
| [Architecture](./architecture.md) | Tech stack, rendering model, directory layout, request lifecycle, key design decisions |
| [Data model](./data-model.md) | Prisma schema, entities, relations, enums, the rating cache, indexes |
| [Authentication & authorization](./authentication.md) | JWT sessions, cookies, middleware, roles, guards, security notes |
| [Features](./features.md) | End-to-end walkthroughs of the gallery, profiles, reviews, submission and approval workflow |
| [Server actions & queries](./server-actions.md) | Reference for every mutation and data-access function |
| [Testing](./testing.md) | Test tooling, structure, coverage, and how to add tests |

## At a glance

- **Framework:** Next.js 15 (App Router, React Server Components, Server Actions)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS with CSS-variable theming (light/dark)
- **Database:** SQLite via Prisma ORM
- **Auth:** `jose` JWT sessions in httpOnly cookies + `bcryptjs`
- **Validation:** Zod
- **Testing:** Vitest + Testing Library (220+ tests; lib + server actions + middleware, ~97% line coverage)

## Principals & roles

Members (`User`) and admins (`Admin`) are separate identities with separate
logins — see [authentication](./authentication.md).

| Principal | Capabilities |
| --- | --- |
| Anonymous | Browse the gallery and profiles, read reviews |
| Member (`User`) | Everything above + submit talent, write/update reviews, view own submissions |
| Admin · `MODERATOR` | Approval queue, feature/delete talent, dashboards |
| Admin · `SUPER_ADMIN` | Everything a moderator can do + manage admin accounts |

# FET Black Tie Event

The Night of Excellence — ticket sales and door check-in for the University of
Buea Faculty of Engineering & Technology Black Tie Gala (4 July 2026, The
Millennium Hall).

Built with **Next.js (App Router)**, **Prisma 7**, and **PostgreSQL**.
Payments are collected through **Fapshi** (MTN Mobile Money / Orange Money).

## Features

- Landing page with ticket tiers (Classic, Classic Couple, VIP, VIP Couple, Table of 5), countdown and animated hero
- Booking flow: server-priced orders → Fapshi payment link → confirmation page with entry QR code + WhatsApp share
- Fapshi webhook + reconciliation endpoint to finalize payments and issue tickets
- Anonymous "shout-out" messages (moderated before projection)
- Staff area (`/auth`, `/admin`): email + password accounts with `admin` / `scanner` roles, orders dashboard, mark-paid, and a camera QR scanner that atomically burns entry slots

## Getting started

1. **Install dependencies** (Bun or npm — `postinstall` runs `prisma generate`):

   ```sh
   bun install
   ```

2. **Configure environment** — copy `.env.example` to `.env` (a localhost
   default is committed) and set:

   | Variable                             | Purpose                                                              |
   | ------------------------------------ | -------------------------------------------------------------------- |
   | `DATABASE_URL`                       | PostgreSQL connection string                                         |
   | `AUTH_SECRET`                        | Secret for signing staff session cookies (`openssl rand -base64 32`) |
   | `FAPSHI_BASE_URL`                    | `https://sandbox.fapshi.com` or `https://live.fapshi.com`            |
   | `FAPSHI_API_USER` / `FAPSHI_API_KEY` | Fapshi API credentials                                               |
   | `FAPSHI_WEBHOOK_SECRET`              | Shared secret checked against the `x-wh-secret` webhook header       |

3. **Create the database schema**:

   ```sh
   bun run db:migrate     # development (creates/applies migrations)
   bun run db:deploy      # production (applies committed migrations)
   ```

4. **Create the first admin account**:

   ```sh
   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=changeme123 bun run db:seed
   ```

   Additional staff can sign up at `/auth`; grant them roles with SQL:

   ```sql
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'scanner' FROM users WHERE email = 'door@example.com';
   ```

5. **Run it**:

   ```sh
   bun run dev            # http://localhost:3000
   bun run build && bun run start   # production
   ```

## Payment finalization

- Point the Fapshi webhook at `POST /api/public/webhooks/fapshi` (sends the
  `x-wh-secret` header).
- Schedule `POST /api/public/cron/reconcile` every few minutes (any external
  scheduler) — it re-queries pending orders against Fapshi and issues tickets
  for payments whose webhook was missed.

## Project layout

```
prisma/                  Prisma 7 schema, migrations, seed script
src/app/                 Next.js App Router pages + API route handlers
src/components/event/    Event UI (ticket cards, QR, countdown, booking form)
src/components/ui/       shadcn/ui components
src/lib/*.actions.ts     Server Actions (booking, messages, admin, auth)
src/lib/server/          Server-only modules (Prisma client, sessions, roles,
                         Fapshi client, atomic ticket slot-burn)
src/generated/prisma/    Generated Prisma client (gitignored, via `prisma generate`)
```

## Notes

- The database schema keeps the original table/column/enum names
  (`orders`, `tickets`, `anonymous_messages`, `user_roles`), so data from the
  previous Supabase database can be imported with a plain SQL dump. Staff
  accounts now live in the `users` table (bcrypt password hashes) instead of
  Supabase Auth and must be re-created.

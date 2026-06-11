# FET Black Tie Event

The Night of Excellence — ticket sales, shout-out wall and door check-in for the
University of Buea Faculty of Engineering & Technology Black Tie Gala
(4 July 2026, Amelia Apart Hotel, Bokwai-Buea).

Built with **Next.js (App Router)**, **Prisma 7**, and **PostgreSQL**.
Payments are collected through **Fapshi** (MTN Mobile Money / Orange Money).

## Features

- Landing page with the event flyer, countdown and 7 ticket tiers (Classic 5K →
  Table of 10 100K); online booking closes automatically on the deadline
- Booking flow: server-priced orders → Fapshi payment link → confirmation page
  with entry QR code + WhatsApp share (QR links to a public `/checkin/<slug>`
  validity page — viewing never consumes entries)
- Fapshi webhook + reconciliation endpoint to finalize payments and issue tickets
- Shout-outs: anonymous messages from `/message`, admin review queue, and a live
  public wall at `/board` made to be projected at the gala
- Staff area (`/auth`, `/admin`):
  - **Admins** — orders dashboard (stats, filters, mark-paid), shout-out
    moderation, and gatekeeper account management
  - **Gatekeepers** — created by an admin in one click; they sign in and land
    straight on the camera QR scanner, which atomically burns entry slots

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
   | `NEXT_PUBLIC_SITE_URL`               | Public URL used for canonical/OG links and the sitemap (optional)    |

3. **Create the database schema**:

   ```sh
   bun run db:migrate     # development (creates/applies migrations)
   bun run db:deploy      # production (applies committed migrations)
   ```

4. **Create the first admin account**:

   ```sh
   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=changeme123 bun run db:seed
   ```

   Gatekeeper accounts are then created from **Admin → Gatekeepers** — no SQL
   needed.

5. **Run it**:

   ```sh
   bun run dev            # http://localhost:3000
   bun run build && bun run start   # production
   ```

## Brand assets

Fonts (Bebas Neue, Anton, Pinyon Script, DM Sans) are self-hosted via
`@fontsource` packages — no external font dependency.

Image assets load from `public/` with styled fallbacks until the files exist:

- `public/logos/ub-logo.png`, `fet-logo.png`, `fetsa-logo.png` — the three crests
- `public/flyer.jpg` — official event flyer shown on the landing hero

## Event configuration

Tier prices/labels/guest counts, venue, contact, and the booking deadline all
live in `src/lib/event.ts` (tier additions also need the `TicketTier` enum in
`prisma/schema.prisma` + a migration).

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
src/components/event/    Event UI (ticket cards, QR, countdown, flyer, booking)
src/components/ui/       shadcn/ui components
src/lib/*.actions.ts     Server Actions (booking, messages, staff, admin, auth)
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

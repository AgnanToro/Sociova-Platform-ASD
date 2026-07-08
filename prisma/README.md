# Prisma — Future Migration Template

> *This folder is
> **not** used at runtime. It exists so you can migrate to a self-managed
> PostgreSQL + Prisma stack later without redesigning the data model.

## Why Prisma is optional

The live app reads and writes through `@supabase/supabase-js` (see
`src/lib/supabase.ts`). Row Level Security enforced by the SQL migrations
in `supabase/migrations/` is the source of truth for access control.

Prisma is included as a schema-of-record so:

- A new engineer can inspect the full data model without opening the DB.
- A future move to a self-managed PostgreSQL (Vercel + Neon / Railway /
  Supabase-self-hosted / Fly / bare metal) is a drop-in replacement,
  not a rewrite.

## When you actually migrate

1. Provision a PostgreSQL instance and set `DATABASE_URL` and `DIRECT_URL`
   in `.env`.
2. Install Prisma:
   ```bash
   bun add -d prisma
   bun add @prisma/client
   ```
3. Generate the client and push the schema:
   ```bash
   bunx prisma generate
   bunx prisma migrate deploy
   ```
4. Swap the runtime data layer in `src/lib/supabase.ts` and
   `src/lib/auth.ts` for a Prisma-based one plus an auth provider
   (Auth.js, Clerk, Lucia, or a Prisma-native session table).

No app code outside `src/lib/` should need to change.

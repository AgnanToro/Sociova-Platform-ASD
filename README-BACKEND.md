# Sociova — Backend Architecture

## Overview

```
React (TanStack Start)
   │
   ▼
API routes (/api/auth/*, /api/data/*)
   │
   ▼
Prisma ORM
   │
   ▼
MySQL (Laragon local)
```

Auth: **JWT (jose) + bcrypt** — adult accounts only (`parent` | `teacher` | `therapist`).

Child: **profile** owned by parent (`children` table), not a login account. Care team links via `care_team_members` + optional `teacher_id` / `therapist_id` on child.

## Environment

```
DATABASE_URL=mysql://root@127.0.0.1:3306/sociova
JWT_SECRET=long-random-secret
```

## Key folders

```
prisma/
  schema.prisma
  seed.mjs
  migrations/

src/
  lib/          # auth, jwt, password, roles, prisma, data client
  features/
    parent/     # parent UI modules
    teacher/
    therapist/
  routes/
    api/auth/
    api/data/
    dashboard*.tsx
```

## Seed

```bash
# after migration + prisma generate
npm run db:seed
```

Passwords are **bcrypt-hashed** (`Sociova123!`). Demo logins: parent/teacher/therapist only.

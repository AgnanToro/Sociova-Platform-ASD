# Sociova — Backend Architecture

## Overview

Sociova uses **Supabase PostgreSQL** as its primary database while **Prisma ORM** manages database access for the backend.

Current architecture:

```
React
   │
   ▼
Backend API
   │
   ▼
Prisma ORM
   │
   ▼
Supabase PostgreSQL
```

Supabase is also used for:

* Authentication
* Storage
* Row Level Security (RLS)

---

## Database

Database provider:

* Supabase PostgreSQL

ORM:

* Prisma

Prisma schema:

```
prisma/schema.prisma
```

Database migrations:

```
prisma/migrations/
```

After the migration is complete, Prisma becomes the primary database access layer.

---

## Authentication

Authentication uses **Supabase Auth**.

Supported providers:

* Email & Password
* Google OAuth

The backend validates Supabase JWT tokens before accessing protected resources.

---

## Tables

* profiles
* user_roles
* children
* learning_progress
* simulation_sessions
* social_stories
* emotion_analyses
* achievements
* community_posts
* user_settings

---

## Environment Variables

```
DATABASE_URL
DIRECT_URL

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Never expose the Service Role Key to the client.

---

## Folder Structure

```
prisma/
 ├── schema.prisma
 └── migrations/

src/
 ├── lib/
 │   ├── auth.ts
 │   ├── roles.ts
 │   └── database.ts
 │
 └── api/
```

---

## Tech Stack

* Prisma ORM
* Supabase PostgreSQL
* Supabase Auth
* TypeScript
* React
* TanStack Router
* TanStack Query

---

## Deployment

Backend can be deployed to:

* Vercel
* Railway
* Render

Database remains hosted on Supabase.

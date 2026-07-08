# Sociova

Platform pembelajaran keterampilan sosial adaptif berbasis AI untuk anak-anak dengan Autism Spectrum Disorder.

---

## Tech Stack

- **Frontend** — React 19, TanStack Router, TanStack Query, Tailwind CSS v4
- **Backend** — TanStack Start (server functions), Prisma ORM
- **Database** — MySQL (Laragon lokal)
- **Auth** — Lokal: bcrypt + JWT (disimpan di localStorage)

---

## Prasyarat

| Tool | Versi |
|------|-------|
| Node.js | ≥ 18 |
| Laragon | dengan MySQL 8 aktif |
| npm | ≥ 9 |

---

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Sociova-ASD-Platform
npm install
```

### 2. Setup `.env`

Salin `.env.example` ke `.env`:

```bash
copy .env.example .env
```

Isi file `.env`:

```env
# Supabase (opsional, untuk fitur lanjutan)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# MySQL Laragon — database lokal
DATABASE_URL=mysql://root@127.0.0.1:3306/sociova

# JWT Secret untuk auth lokal — ganti dengan string acak di production
JWT_SECRET=ganti-dengan-string-acak-yang-panjang
```

### 3. Buat Database MySQL

Buka terminal Laragon atau HeidiSQL, lalu jalankan:

```sql
CREATE DATABASE sociova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan Migrasi

```bash
# Buat semua tabel dan seed data
mysql -u root sociova < prisma/migrations/001_init_sociova.sql
```

> Di Windows PowerShell, pakai:
> ```powershell
> Get-Content "prisma\migrations\001_init_sociova.sql" | mysql -u root sociova
> ```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Jalankan Dev Server

```bash
npm run dev
```

Buka browser: [http://localhost:3000] atau (http://localhost:5173)

---

## Struktur Folder Penting

```
src/
├── routes/          # Halaman (TanStack Router file-based routing)
│   ├── index.tsx    # Landing page
│   ├── login.tsx    # Halaman login
│   ├── register.tsx # Halaman daftar
│   └── dashboard/   # Dashboard setelah login
│
├── lib/
│   ├── auth.ts      # Auth lokal (JWT + localStorage)
│   ├── prisma.ts    # Prisma client singleton
│   └── roles.ts     # Definisi role (child/parent/teacher/therapist)
│
├── server/
│   └── auth.ts      # Server functions: registerFn, loginFn
│
└── components/
    ├── ui/          # Komponen shadcn/ui
    └── site/        # Komponen layout (navbar, sidebar, dll)

prisma/
├── schema.prisma          # Skema database
└── migrations/
    └── 001_init_sociova.sql  # Migrasi + seed data
```

---

## Auth Flow

```
Register / Login
      │
      ▼
Server Function (src/server/auth.ts)
  • Register: bcrypt hash password → simpan ke MySQL → return JWT
  • Login: ambil profile → bcrypt compare → return JWT
      │
      ▼
Client (src/lib/auth.ts)
  • Simpan JWT + user info ke localStorage
  • useAuth() hook baca dari localStorage
  • signOut() hapus localStorage + redirect /login
```

---

## Tabel Database

| Tabel | Keterangan |
|-------|------------|
| `profiles` | Data user (nama, email, password_hash) |
| `user_roles` | Role user (child/parent/teacher/therapist) |
| `user_settings` | Preferensi notifikasi & aksesibilitas |
| `children` | Profil anak |
| `learning_progress` | XP, level, streak, skor per skill |
| `simulation_sessions` | Riwayat sesi simulasi AI |
| `social_stories` | Cerita sosial yang digenerate |
| `emotion_analyses` | Riwayat analisis emosi |
| `achievements` | Badge/pencapaian anak |
| `journey_levels` | Konten level perjalanan (seed) |
| `user_journey_progress` | Progress level per anak |
| `missions` | Misi harian/mingguan (seed) |
| `simulation_scenarios` | Skenario simulasi AI (seed) |
| `resources` | Sumber belajar (seed) |
| `community_posts` | Postingan komunitas |

---

## Scripts

```bash
npm run dev          # Jalankan dev server
npm run build        # Build production
npm run lint         # Lint kode
npx prisma generate  # Generate ulang Prisma client setelah ubah schema
npx prisma studio    # Buka GUI database Prisma
```

---

## Catatan

- Auth lokal **tidak** butuh Supabase — langsung ke MySQL.
- Token JWT disimpan di `localStorage` dengan key `sociova-token`.
- Untuk production, ganti `JWT_SECRET` dengan string acak minimal 32 karakter.
- Supabase masih tersedia sebagai konfigurasi opsional untuk fitur lanjutan (realtime, storage).

# Sociova

Sociova adalah platform kolaboratif untuk mendukung perkembangan sosial anak dengan Autism Spectrum Disorder (ASD) melalui integrasi anak, orang tua, guru, dan terapis.

## Tech Stack

- React + TanStack Start
- Tailwind CSS
- Prisma ORM
- MySQL (Laragon)
- JWT Authentication

---

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Sociova-ASD-Platform
npm install
```

### 2. Setup `.env`

Salin `.env.example` ke `.env`

```bash
copy .env.example .env
```

Isi file `.env`:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/sociova"
JWT_SECRET="your-secret-key"
```

### 3. Buat Database

```sql
CREATE DATABASE sociova;
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Jalankan Migration

Jika menggunakan Prisma:

```bash
npx prisma migrate dev
```

atau migration SQL:

```powershell
Get-Content "prisma\migrations\001_init_sociova.sql" | mysql -u root sociova
Get-Content "prisma\migrations\202607220001_role_collaboration_data\migration.sql" | mysql -u root sociova
```

### 6. Seed Demo Data

```bash
npm run db:seed
```

### 7. Jalankan Project

```bash
npm run dev
```

Aplikasi berjalan di:

```text
http://localhost:5173
```

---

## Demo Accounts

Password semua akun (disimpan sebagai **bcrypt hash** di DB):

```text
Sociova123!
```

| Role | Email |
|------|--------|
| Child | bimo@sociova.local |
| Parent | budi@sociova.local |
| Teacher | siti@sociova.local |
| Therapist | dr.andini@sociova.local |
| Admin |  admin@sociova.local |

**Catatan:** Akun anak dibuat oleh parent di menu **Kelola Anak** (email + password). Anak login sendiri dan melihat menu belajar. Parent hanya monitor (progress, report, analytics).

---

## Useful Commands

```bash
npm run dev
npm run build
npm run db:seed
npx prisma generate
npx prisma studio
```

---


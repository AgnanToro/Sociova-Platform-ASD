/**
 * Local auth server functions — register & login via MySQL + bcrypt + JWT.
 * Import file ini HANYA dari route files (bukan dari src/lib/).
 * TanStack Start import-protection melarang dynamic import server files dari client.
 */
"use server";

import { createServerFn } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import type { AppRole } from "@/lib/roles";

// ── helpers ───────────────────────────────────────────────────────────────────

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set in .env");
  return new TextEncoder().encode(s);
}

export async function signToken(payload: {
  userId: string;
  email: string;
  role: AppRole;
}): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string,
): Promise<{ userId: string; email: string; role: AppRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as { userId: string; email: string; role: AppRole };
  } catch {
    return null;
  }
}

function makeDb() {
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
}

// ── schemas ───────────────────────────────────────────────────────────────────

const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["child", "parent", "teacher", "therapist"]),
});

const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── result type ───────────────────────────────────────────────────────────────

export type AuthResult =
  | { ok: true; token: string; userId: string; role: AppRole; fullName: string }
  | { ok: false; error: string };

// ── server functions ──────────────────────────────────────────────────────────

export const registerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => RegisterInput.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const prisma = makeDb();
    try {
      const existing = await prisma.userProfile.findFirst({
        where: { email: data.email },
      });
      if (existing) {
        return { ok: false, error: "Email sudah terdaftar. Silakan masuk." };
      }

      const hash = await bcrypt.hash(data.password, 12);
      const userId = uuidv4();

      await prisma.$transaction([
        prisma.userProfile.create({
          data: { userId, email: data.email, fullName: data.fullName, passwordHash: hash },
        }),
        prisma.userRole.create({
          data: { userId, role: data.role as AppRole },
        }),
        prisma.userSettings.create({
          data: { userId },
        }),
      ]);

      if (data.role === "child") {
        const child = await prisma.childProfile.create({
          data: {
            parentId: userId,
            userId,
            name: data.fullName,
            age: 8,
            diagnosisLevel: "ASD support profile",
            learningGoal: "Melatih komunikasi sosial dengan bantuan Sova",
          },
        });
        await prisma.learningProgress.create({
          data: { childId: child.id, totalMissions: 6, weeklyGoal: 6 },
        });
      }

      const token = await signToken({ userId, email: data.email, role: data.role as AppRole });
      return { ok: true, token, userId, role: data.role as AppRole, fullName: data.fullName };
    } finally {
      await prisma.$disconnect();
    }
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => LoginInput.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const prisma = makeDb();
    try {
      const profile = await prisma.userProfile.findFirst({
        where: { email: data.email },
        include: { roles: true },
      });

      if (!profile || !profile.passwordHash) {
        return { ok: false, error: "Email atau password salah." };
      }

      const match = await bcrypt.compare(data.password, profile.passwordHash);
      if (!match) {
        return { ok: false, error: "Email atau password salah." };
      }

      const role = (profile.roles[0]?.role ?? "parent") as AppRole;
      const token = await signToken({ userId: profile.userId, email: profile.email!, role });

      return { ok: true, token, userId: profile.userId, role, fullName: profile.fullName ?? "" };
    } finally {
      await prisma.$disconnect();
    }
  });

import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set in .env");
  return new TextEncoder().encode(s);
}

async function signToken(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Parse body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        // Validate
        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
          return json({ ok: false, error: parsed.error.errors[0]?.message ?? "Input tidak valid" }, 400);
        }

        const { email, password } = parsed.data;
        const prisma = new PrismaClient();

        try {
          const profile = await prisma.userProfile.findFirst({
            where: { email },
            include: { roles: true },
          });

          if (!profile || !profile.passwordHash) {
            return json({ ok: false, error: "Email atau password salah." }, 401);
          }

          const match = await bcrypt.compare(password, profile.passwordHash);
          if (!match) {
            return json({ ok: false, error: "Email atau password salah." }, 401);
          }

          const role     = (profile.roles[0]?.role as string) ?? "parent";
          const fullName = profile.fullName ?? "";
          const token    = await signToken({ userId: profile.userId, email: profile.email!, role });

          return json({ ok: true, token, userId: profile.userId, role, fullName });

        } catch (err) {
          console.error("[login] error:", err);
          return json({ ok: false, error: "Server error. Coba lagi." }, 500);
        } finally {
          await prisma.$disconnect();
        }
      },
    },
  },
});

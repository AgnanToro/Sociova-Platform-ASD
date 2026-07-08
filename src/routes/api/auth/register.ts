import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role:     z.enum(["child", "parent", "teacher", "therapist"]),
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

export const Route = createFileRoute("/api/auth/register")({
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
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
          return json({ ok: false, error: parsed.error.errors[0]?.message ?? "Input tidak valid" }, 400);
        }

        const { email, password, fullName, role } = parsed.data;
        const prisma = new PrismaClient();

        try {
          // Check duplicate
          const existing = await prisma.userProfile.findFirst({ where: { email } });
          if (existing) {
            return json({ ok: false, error: "Email sudah terdaftar. Silakan masuk." }, 409);
          }

          const hash   = await bcrypt.hash(password, 12);
          const userId = uuidv4();

          // Create user records
          await prisma.$transaction([
            prisma.userProfile.create({
              data: { userId, email, fullName, passwordHash: hash },
            }),
            prisma.userRole.create({ data: { userId, role } }),
            prisma.userSettings.create({ data: { userId } }),
          ]);

          // Auto-create child profile
          if (role === "child") {
            const child = await prisma.childProfile.create({
              data: {
                parentId: userId, userId, name: fullName, age: 8,
                diagnosisLevel: "ASD support profile",
                learningGoal: "Melatih komunikasi sosial dengan bantuan Sova",
              },
            });
            await prisma.learningProgress.create({
              data: { childId: child.id, totalMissions: 6, weeklyGoal: 6 },
            });
          }

          const token = await signToken({ userId, email, role });
          return json({ ok: true, token, userId, role, fullName });

        } catch (err) {
          console.error("[register] error:", err);
          return json({ ok: false, error: "Server error. Coba lagi." }, 500);
        } finally {
          await prisma.$disconnect();
        }
      },
    },
  },
});

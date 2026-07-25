import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { hashPassword, isPasswordStrong } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import type { AuthRole } from "@/lib/roles";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

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
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { ok: false, error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
            400,
          );
        }

        const { email, password, fullName } = parsed.data;
        const role: AuthRole = "parent";

        if (!isPasswordStrong(password)) {
          return json(
            {
              ok: false,
              error: "Password minimal 8 karakter, mengandung huruf kapital dan angka.",
            },
            400,
          );
        }

        try {
          const existing = await prisma.userProfile.findFirst({ where: { email } });
          if (existing) {
            return json({ ok: false, error: "Email sudah terdaftar. Silakan masuk." }, 409);
          }

          const passwordHash = await hashPassword(password);
          const userId = uuidv4();

          await prisma.$transaction([
            prisma.userProfile.create({
              data: { userId, email, fullName, passwordHash },
            }),
            prisma.userRole.create({ data: { userId, role } }),
            prisma.userSettings.create({ data: { userId } }),
          ]);

          const token = await signToken({
            userId,
            email,
            role,
          });

          return json({ ok: true, token, userId, role, fullName });
        } catch (err) {
          console.error("[register] error:", err);
          return json({ ok: false, error: "Server error. Coba lagi." }, 500);
        }
      },
    },
  },
});

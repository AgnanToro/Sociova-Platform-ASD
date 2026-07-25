import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { isAuthRole, type AuthRole } from "@/lib/roles";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { ok: false, error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
            400,
          );
        }

        const { email, password } = parsed.data;

        try {
          const profile = await prisma.userProfile.findFirst({
            where: { email },
            include: { roles: true },
          });

          if (!profile || !profile.passwordHash) {
            return json({ ok: false, error: "Email atau password salah." }, 401);
          }

          const match = await verifyPassword(password, profile.passwordHash);
          if (!match) {
            return json({ ok: false, error: "Email atau password salah." }, 401);
          }

          const rawRole = profile.roles.find((r) => isAuthRole(r.role))?.role;
          if (!rawRole || !isAuthRole(rawRole)) {
            return json(
              {
                ok: false,
                error:
                  "Akun ini tidak memiliki role login yang valid. Anak dikelola lewat akun orang tua.",
              },
              403,
            );
          }

          const role = rawRole as AuthRole;
          const fullName = profile.fullName ?? "";
          const token = await signToken({
            userId: profile.userId,
            email: profile.email!,
            role,
          });

          return json({ ok: true, token, userId: profile.userId, role, fullName });
        } catch (err) {
          console.error("[login] error:", err);
          return json({ ok: false, error: "Server error. Coba lagi." }, 500);
        }
      },
    },
  },
});

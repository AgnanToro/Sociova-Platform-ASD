/**
 * Shared server auth helpers (JWT). Prefer /api/auth/* HTTP routes for login/register.
 */
import { signToken, verifyToken, type JwtPayload } from "@/lib/jwt";
import type { AuthRole } from "@/lib/roles";

export { signToken, verifyToken };
export type { JwtPayload, AuthRole };

export type AuthResult =
  | { ok: true; token: string; userId: string; role: AuthRole; fullName: string }
  | { ok: false; error: string };

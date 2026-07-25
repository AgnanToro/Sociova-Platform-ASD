import bcrypt from "bcryptjs";
import { isPasswordStrong } from "@/lib/password-policy";

/** Shared password hashing for register + seed (same standard). Server-only. */
export const PASSWORD_ROUNDS = 12;

export const DEMO_PASSWORD = "Sociova123!";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export { isPasswordStrong };

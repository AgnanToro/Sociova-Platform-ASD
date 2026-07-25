import { SignJWT, jwtVerify } from "jose";
import type { AuthRole } from "@/lib/roles";

export type JwtPayload = {
  userId: string;
  email: string;
  role: AuthRole;
};

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set in .env");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: String(payload.userId),
      email: String(payload.email ?? ""),
      role: String(payload.role) as AuthRole,
    };
  } catch {
    return null;
  }
}

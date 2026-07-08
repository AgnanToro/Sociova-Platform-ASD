/**
 * Sociova — Client-side Auth Helpers
 *
 * Token + user disimpan di localStorage.
 * Server functions (registerFn, loginFn) dipanggil langsung dari route files
 * karena TanStack Start melarang import server files dari client code.
 */
import { useEffect, useState, useCallback } from "react";
import type { AppRole } from "@/lib/roles";
import { ROLE_HOME } from "@/lib/roles";

const TOKEN_KEY = "sociova-token";
const USER_KEY  = "sociova-user";

// ── types ─────────────────────────────────────────────────────────────────────

export type LocalUser = {
  userId:   string;
  email:    string;
  role:     AppRole;
  fullName: string;
};

export type AuthState = {
  user:    LocalUser | null;
  role:    AppRole | null;
  loading: boolean;
  /** Compat shim — beberapa komponen dashboard baca session.user */
  session: { user: LocalUser } | null;
};

// ── storage helpers ───────────────────────────────────────────────────────────

export function saveSession(token: string, user: LocalUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useAuth(): AuthState & {
  signOut: () => void;
  refreshRole: () => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null, role: null, loading: true, session: null,
  });

  useEffect(() => {
    const user = getStoredUser();
    setState({ user, role: user?.role ?? null, loading: false, session: user ? { user } : null });
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setState({ user: null, role: null, loading: false, session: null });
    window.location.href = "/login";
  }, []);

  const refreshRole = useCallback(() => {
    const user = getStoredUser();
    setState((s) => ({ ...s, role: user?.role ?? null }));
  }, []);

  return { ...state, signOut, refreshRole };
}

// ── role helper ───────────────────────────────────────────────────────────────

export function roleHome(role: AppRole | null | undefined): string {
  return role ? ROLE_HOME[role] : "/dashboard";
}

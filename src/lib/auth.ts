/**
 * Sociova — Client-side Auth Helpers
 * Token + user di localStorage. Roles: child | parent | teacher | therapist.
 * Child accounts are created by parent (not self-register).
 */
import { useEffect, useState, useCallback } from "react";
import type { AuthRole } from "@/lib/roles";
import { isAuthRole, ROLE_HOME } from "@/lib/roles";

const TOKEN_KEY = "sociova-token";
const USER_KEY = "sociova-user";

export type LocalUser = {
  userId: string;
  email: string;
  role: AuthRole;
  fullName: string;
};

export type AuthState = {
  user: LocalUser | null;
  role: AuthRole | null;
  loading: boolean;
  session: { user: LocalUser } | null;
};

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
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalUser;
    if (!isAuthRole(parsed.role)) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth(): AuthState & {
  signOut: () => void;
  refreshRole: () => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
    session: null,
  });

  useEffect(() => {
    const user = getStoredUser();
    setState({
      user,
      role: user?.role ?? null,
      loading: false,
      session: user ? { user } : null,
    });
  }, []);

  const signOut = useCallback(() => {
    // Clear storage then hard-navigate immediately so React never re-renders
    // the dashboard with role=null (which briefly shows the default sidebar).
    clearSession();
    window.location.replace("/login");
  }, []);

  const refreshRole = useCallback(() => {
    const user = getStoredUser();
    setState((s) => ({ ...s, role: user?.role ?? null, user, session: user ? { user } : null }));
  }, []);

  return { ...state, signOut, refreshRole };
}

export function roleHome(role: AuthRole | null | undefined): string {
  return role ? ROLE_HOME[role] : "/login";
}

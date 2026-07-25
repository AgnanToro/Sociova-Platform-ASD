/** Roles that can log in. */
export type AuthRole = "child" | "parent" | "teacher" | "therapist" | "admin";

export type AppRole = AuthRole;

export const AUTH_ROLES: AuthRole[] = ["child", "parent", "teacher", "therapist", "admin"];

/** Public self-registration: parent only. Guru/terapis/admin dibuat lewat panel Admin. */
export const REGISTER_ROLES: Array<"parent"> = ["parent"];

export const ROLE_LABELS: Record<AuthRole, string> = {
  child: "Anak",
  parent: "Orang Tua",
  teacher: "Guru",
  therapist: "Terapis",
  admin: "Admin",
};

export const ROLE_HOME: Record<AuthRole, string> = {
  child: "/dashboard",
  parent: "/dashboard",
  teacher: "/dashboard",
  therapist: "/dashboard",
  admin: "/dashboard",
};

export const ROLE_ROUTES: Record<AuthRole, string[]> = {
  child: [
    "/dashboard",
    "/dashboard/child/mission",
    "/dashboard/child/journey",
    "/dashboard/child/simulation",
    "/dashboard/child/emotion",
    "/dashboard/child/story",
    "/dashboard/child/achievements",
    "/dashboard/shared/community",
    "/dashboard/shared/settings",
  ],
  parent: [
    "/dashboard",
    "/dashboard/parent",
    "/dashboard/parent/children",
    "/dashboard/parent/report",
    "/dashboard/parent/analytics",
    "/dashboard/parent/resources",
    "/dashboard/shared/community",
    "/dashboard/shared/settings",
  ],
  teacher: [
    "/dashboard",
    "/dashboard/teacher",
    "/dashboard/teacher/observations",
    "/dashboard/teacher/report",
    "/dashboard/teacher/analytics",
    "/dashboard/teacher/resources",
    "/dashboard/shared/community",
    "/dashboard/shared/settings",
  ],
  therapist: [
    "/dashboard",
    "/dashboard/therapist",
    "/dashboard/therapist/sessions",
    "/dashboard/therapist/emotion",
    "/dashboard/therapist/report",
    "/dashboard/therapist/analytics",
    "/dashboard/therapist/resources",
    "/dashboard/shared/community",
    "/dashboard/shared/settings",
  ],
  admin: [
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/admin/users",
    "/dashboard/admin/resources",
    "/dashboard/admin/community",
    "/dashboard/shared/settings",
  ],
};

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    value === "child" ||
    value === "parent" ||
    value === "teacher" ||
    value === "therapist" ||
    value === "admin"
  );
}

export function canAccessPath(role: AuthRole | null | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role] ?? [];
  const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return allowed.some((route) => {
    const r = route.endsWith("/") && route.length > 1 ? route.slice(0, -1) : route;
    return normalized === r || (r !== "/dashboard" && normalized.startsWith(`${r}/`));
  });
}

export const ROLE_ACCESS: Record<AuthRole, string[]> = {
  child: ["journey", "simulation", "emotion", "achievements", "mission", "community", "settings"],
  parent: [
    "children",
    "child-progress",
    "weekly-report",
    "analytics",
    "resources",
    "community",
    "settings",
  ],
  teacher: ["students", "observations", "weekly-report", "analytics", "resources", "community", "settings"],
  therapist: [
    "clients",
    "session-notes",
    "emotion-trends",
    "weekly-report",
    "analytics",
    "resources",
    "community",
    "settings",
  ],
  admin: ["users", "resources", "community", "settings", "dashboard"],
};

export function canAccess(role: AuthRole | null | undefined, feature: string) {
  if (!role) return false;
  return ROLE_ACCESS[role]?.includes(feature) ?? false;
}

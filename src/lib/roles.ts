export type AppRole = "child" | "parent" | "teacher" | "therapist";

export const ROLE_LABELS: Record<AppRole, string> = {
  child: "Child",
  parent: "Parent",
  teacher: "Teacher",
  therapist: "Therapist",
};

export const ROLE_HOME: Record<AppRole, string> = {
  child: "/dashboard",
  parent: "/dashboard/parent",
  teacher: "/dashboard/teacher",
  therapist: "/dashboard/therapist",
};

/** Feature areas each role is allowed to access (used for UI gating). */
export const ROLE_ACCESS: Record<AppRole, string[]> = {
  child: ["journey", "simulation", "emotion", "achievements"],
  parent: ["child-progress", "story", "weekly-report", "settings"],
  teacher: ["students", "class-progress", "assignments", "analytics"],
  therapist: ["clients", "emotion-trends", "session-notes", "recommendations"],
};

export function canAccess(role: AppRole | null | undefined, feature: string) {
  if (!role) return false;
  return ROLE_ACCESS[role]?.includes(feature) ?? false;
}

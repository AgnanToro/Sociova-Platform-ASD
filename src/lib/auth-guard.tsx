import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { canAccessPath, type AuthRole } from "@/lib/roles";
import { Card } from "@/components/ui/card";

export function AuthGate({
  children,
  roles,
  path,
}: {
  children: ReactNode;
  roles?: AuthRole[];
  path?: string;
}) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (roles && !roles.includes(role)) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (path && !canAccessPath(role, path)) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, role, roles, path, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Memuat sesi…</div>
          <p className="mt-1 text-sm text-muted-foreground">Menyiapkan dashboard Sociova.</p>
        </Card>
      </div>
    );
  }

  if (!user || !role) return null;
  if (roles && !roles.includes(role)) return null;
  if (path && !canAccessPath(role, path)) return null;

  return <>{children}</>;
}

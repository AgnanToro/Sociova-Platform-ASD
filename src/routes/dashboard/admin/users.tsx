import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AdminUsers } from "@/features/admin";

export const Route = createFileRoute("/dashboard/admin/users")({
  component: () => (
    <AuthGate roles={["admin"]} path="/dashboard/admin/users">
      <AdminUsers />
    </AuthGate>
  ),
});

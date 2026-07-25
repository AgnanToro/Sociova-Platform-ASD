import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AdminCommunity } from "@/features/admin";

export const Route = createFileRoute("/dashboard/admin/community")({
  component: () => (
    <AuthGate roles={["admin"]} path="/dashboard/admin/community">
      <AdminCommunity />
    </AuthGate>
  ),
});

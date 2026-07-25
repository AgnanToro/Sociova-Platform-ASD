import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ResourcesPage } from "@/features/shared/ResourcesPage";

export const Route = createFileRoute("/dashboard/admin/resources")({
  component: () => (
    <AuthGate roles={["admin"]} path="/dashboard/admin/resources">
      <ResourcesPage />
    </AuthGate>
  ),
});

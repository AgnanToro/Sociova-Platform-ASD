import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ResourcesPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/parent/resources")({
  component: () => (
    <AuthGate roles={["parent"]} path="/dashboard/parent/resources">
      <ResourcesPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ResourcesPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/therapist/resources")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist/resources">
      <ResourcesPage />
    </AuthGate>
  ),
});

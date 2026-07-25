import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ResourcesPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/teacher/resources")({
  component: () => (
    <AuthGate roles={["teacher"]} path="/dashboard/teacher/resources">
      <ResourcesPage />
    </AuthGate>
  ),
});

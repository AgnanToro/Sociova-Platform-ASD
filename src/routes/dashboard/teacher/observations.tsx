import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ObservationsPage } from "@/features/teacher";

export const Route = createFileRoute("/dashboard/teacher/observations")({
  component: () => (
    <AuthGate roles={["teacher"]} path="/dashboard/teacher/observations">
      <ObservationsPage />
    </AuthGate>
  ),
});

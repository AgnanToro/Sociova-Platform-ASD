import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AnalyticsPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/therapist/analytics")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist/analytics">
      <AnalyticsPage />
    </AuthGate>
  ),
});

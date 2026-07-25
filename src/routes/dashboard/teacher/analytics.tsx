import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AnalyticsPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/teacher/analytics")({
  component: () => (
    <AuthGate roles={["teacher"]} path="/dashboard/teacher/analytics">
      <AnalyticsPage />
    </AuthGate>
  ),
});

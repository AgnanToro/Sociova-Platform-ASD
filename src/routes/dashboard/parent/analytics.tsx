import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AnalyticsPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/parent/analytics")({
  component: () => (
    <AuthGate roles={["parent"]} path="/dashboard/parent/analytics">
      <AnalyticsPage />
    </AuthGate>
  ),
});

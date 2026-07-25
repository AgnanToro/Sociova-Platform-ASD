import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ReportPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/therapist/report")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist/report">
      <ReportPage />
    </AuthGate>
  ),
});

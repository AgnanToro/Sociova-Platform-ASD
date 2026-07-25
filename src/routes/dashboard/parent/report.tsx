import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ReportPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/parent/report")({
  component: () => (
    <AuthGate roles={["parent"]} path="/dashboard/parent/report">
      <ReportPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ReportPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/teacher/report")({
  component: () => (
    <AuthGate roles={["teacher"]} path="/dashboard/teacher/report">
      <ReportPage />
    </AuthGate>
  ),
});

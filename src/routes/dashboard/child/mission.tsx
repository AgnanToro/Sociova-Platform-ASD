import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { MissionPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/mission")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/mission">
      <MissionPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { AchievementsPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/achievements")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/achievements">
      <AchievementsPage />
    </AuthGate>
  ),
});

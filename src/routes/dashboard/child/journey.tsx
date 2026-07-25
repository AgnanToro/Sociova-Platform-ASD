import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { JourneyPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/journey")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/journey">
      <JourneyPage />
    </AuthGate>
  ),
});

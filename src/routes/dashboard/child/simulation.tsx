import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { SimulationPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/simulation")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/simulation">
      <SimulationPage />
    </AuthGate>
  ),
});

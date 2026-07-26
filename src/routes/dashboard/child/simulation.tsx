import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { SimulationPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/simulation")({
  validateSearch: (raw: Record<string, unknown>) => ({
    scenario: typeof raw.scenario === "string" ? raw.scenario : undefined,
    journey: typeof raw.journey === "string" ? raw.journey : undefined,
  }),
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/simulation">
      <SimulationPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { TherapistClients } from "@/features/therapist";

export const Route = createFileRoute("/dashboard/therapist/")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist">
      <TherapistClients />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { SessionNotesPage } from "@/features/therapist";

export const Route = createFileRoute("/dashboard/therapist/sessions")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist/sessions">
      <SessionNotesPage />
    </AuthGate>
  ),
});

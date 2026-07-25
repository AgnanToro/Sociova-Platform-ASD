import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { EmotionPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/therapist/emotion")({
  component: () => (
    <AuthGate roles={["therapist"]} path="/dashboard/therapist/emotion">
      <EmotionPage />
    </AuthGate>
  ),
});

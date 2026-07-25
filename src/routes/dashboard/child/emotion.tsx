import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { EmotionPage } from "@/features/child";

export const Route = createFileRoute("/dashboard/child/emotion")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/emotion">
      <EmotionPage />
    </AuthGate>
  ),
});

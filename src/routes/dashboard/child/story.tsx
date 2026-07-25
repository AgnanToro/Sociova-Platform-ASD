import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { StoryPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/child/story")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/story">
      <StoryPage />
    </AuthGate>
  ),
});

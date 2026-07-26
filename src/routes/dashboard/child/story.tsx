import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ChildStoryPage } from "@/features/child/ChildStoryPage";

export const Route = createFileRoute("/dashboard/child/story")({
  component: () => (
    <AuthGate roles={["child"]} path="/dashboard/child/story">
      <ChildStoryPage />
    </AuthGate>
  ),
});

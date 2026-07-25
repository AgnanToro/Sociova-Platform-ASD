import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { CommunityPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/shared/community")({
  component: () => (
    <AuthGate path="/dashboard/shared/community">
      <CommunityPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { SettingsPage } from "@/features/shared";

export const Route = createFileRoute("/dashboard/shared/settings")({
  component: () => (
    <AuthGate path="/dashboard/shared/settings">
      <SettingsPage />
    </AuthGate>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ChildrenManager } from "@/features/parent";

export const Route = createFileRoute("/dashboard/parent/children")({
  component: () => (
    <AuthGate roles={["parent"]} path="/dashboard/parent/children">
      <ChildrenManager />
    </AuthGate>
  ),
});

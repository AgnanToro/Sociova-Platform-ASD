import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { ChildProgress } from "@/features/parent";

export const Route = createFileRoute("/dashboard/parent/")({
  component: () => (
    <AuthGate roles={["parent"]} path="/dashboard/parent">
      <ChildProgress />
    </AuthGate>
  ),
});

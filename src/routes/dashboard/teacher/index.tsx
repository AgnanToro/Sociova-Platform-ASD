import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/lib/auth-guard";
import { TeacherStudents } from "@/features/teacher";

export const Route = createFileRoute("/dashboard/teacher/")({
  component: () => (
    <AuthGate roles={["teacher"]} path="/dashboard/teacher">
      <TeacherStudents />
    </AuthGate>
  ),
});

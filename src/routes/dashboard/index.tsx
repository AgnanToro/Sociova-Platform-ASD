import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { ChildHome } from "@/features/child";
import { ParentDashboard } from "@/features/parent";
import { TeacherDashboard } from "@/features/teacher";
import { TherapistDashboard } from "@/features/therapist";
import { AdminDashboard } from "@/features/admin";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
          <div className="font-display text-lg font-bold">Loading dashboard</div>
          <p className="mt-1 text-sm text-muted-foreground">Menyiapkan ruang kerja Anda.</p>
        </Card>
      </div>
    );
  }

  if (role === "child") return <ChildHome />;
  if (role === "parent") return <ParentDashboard />;
  if (role === "teacher") return <TeacherDashboard />;
  if (role === "therapist") return <TherapistDashboard />;
  if (role === "admin") return <AdminDashboard />;

  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">Sesi tidak valid</div>
        <p className="mt-1 text-sm text-muted-foreground">Silakan login ulang.</p>
      </Card>
    </div>
  );
}

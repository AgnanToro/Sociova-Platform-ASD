import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { loadRoleDashboardData, useSociovaQuery } from "@/lib/sociova-data";

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl bg-background/40 p-3">
      <div className="font-display text-xl font-bold">{value ?? 0}%</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function State({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

export function TeacherStudents() {
  const { data, loading, error } = useSociovaQuery(() => loadRoleDashboardData("teacher"));

  if (loading) return <State title="Loading students" description="Memuat daftar siswa." />;
  if (error) return <State title="Students unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Students" description="Siswa yang terhubung ke kelas inklusi Anda." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.children?.map((child: any) => {
          const progress = data.progressByChild?.[child.id] ?? {};
          return (
            <Card key={child.id} className="rounded-2xl border-border/60 bg-card/60 p-6">
              <div className="font-display text-xl font-bold">{child.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {child.age} tahun · {child.diagnosis_level}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Score label="Komunikasi" value={progress.communication_score} />
                <Score label="Kepercayaan diri" value={progress.confidence_score} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Target: {child.learning_goal}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

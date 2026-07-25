import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { loadRoleDashboardData, useSociovaQuery } from "@/lib/sociova-data";

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

export function TherapistClients() {
  const { data, loading, error } = useSociovaQuery(() => loadRoleDashboardData("therapist"));

  if (loading) return <StateCard title="Loading clients" description="Memuat daftar klien Anda." />;
  if (error) return <StateCard title="Clients unavailable" description={error} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Clients" description="Daftar klien yang terhubung ke akun terapi Anda." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.children?.map((child: any) => {
          const progress = data.progressByChild?.[child.id] ?? {};
          return (
            <Card
              key={child.id}
              className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-xl font-bold">{child.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {child.age} tahun · {child.diagnosis_level}
                  </p>
                </div>
                <UserRound className="h-5 w-5 text-[color:var(--brand)]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-background/40 p-3">
                  <div className="text-muted-foreground">Komunikasi</div>
                  <div className="font-display text-xl font-bold">
                    {progress.communication_score ?? 0}%
                  </div>
                </div>
                <div className="rounded-xl bg-background/40 p-3">
                  <div className="text-muted-foreground">Empati</div>
                  <div className="font-display text-xl font-bold">
                    {progress.empathy_score ?? 0}%
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{child.learning_goal}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

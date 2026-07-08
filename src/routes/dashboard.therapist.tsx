import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { HeartPulse, Activity, NotebookPen, Sparkles } from "lucide-react";
import { loadRoleDashboardData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/therapist")({
  head: () => ({ meta: [{ title: "Therapist Dashboard · Sociova" }] }),
  component: TherapistDashboard,
});

function TherapistDashboard() {
  const { data, loading, error } = useSociovaQuery(() => loadRoleDashboardData("therapist"));
  const cards = [
    { icon: HeartPulse, title: "Client Progress", desc: "Pantau perkembangan setiap klien." },
    { icon: Activity, title: "Emotion Trends", desc: "Tren emosi harian dan mingguan." },
    { icon: NotebookPen, title: "Session Notes", desc: "Catatan sesi terapi terintegrasi." },
    { icon: Sparkles, title: "Recommendations", desc: "Rekomendasi latihan berbasis AI." },
  ];
  if (loading)
    return (
      <StateCard
        title="Loading therapist dashboard"
        description="Sova sedang memuat progres klien."
      />
    );
  if (error) return <StateCard title="Therapist dashboard unavailable" description={error} />;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Therapist Dashboard"
        description="Alat klinis untuk mendampingi klien ASD Anda secara adaptif."
      />
      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          No linked profile yet. Demo data is shown for preview.
        </Card>
      )}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {data?.children.map((child: any) => {
          const progress = data.progressByChild[child.id] ?? {};
          return (
            <Card
              key={child.id}
              className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm"
            >
              <div className="text-sm text-muted-foreground">Client Progress</div>
              <div className="mt-1 font-display text-xl font-bold">{child.name}</div>
              <div className="mt-2 text-sm">Emotion readiness {progress.empathy_score ?? 72}%</div>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, title, desc }) => (
          <Card
            key={title}
            className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm"
          >
            <Icon className="h-6 w-6 text-[color:var(--brand)]" />
            <h3 className="mt-3 font-display text-base font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

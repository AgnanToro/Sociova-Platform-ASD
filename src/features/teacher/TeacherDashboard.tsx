import { BarChart3, ClipboardList, GraduationCap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { useAuth } from "@/lib/auth";
import { loadRoleDashboardData, loadRoleDetailData, useSociovaQuery } from "@/lib/sociova-data";

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-5">
      <Icon className="h-5 w-5 text-[color:var(--brand)]" />
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}

function Entries({
  title,
  items,
  field,
}: {
  title: string;
  items: any[];
  field: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.slice(0, 3).map((item: any) => (
            <div key={item.id} className="rounded-xl border border-border/60 p-3">
              <div className="font-medium">{item.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item[field] ?? "-"}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        )}
      </div>
    </Card>
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

export function TeacherDashboard() {
  const { user } = useAuth();
  const summary = useSociovaQuery(() => loadRoleDashboardData("teacher"));
  const detail = useSociovaQuery(loadRoleDetailData);

  if (summary.loading || detail.loading) {
    return <State title="Loading dashboard" description="Memuat ringkasan kelas." />;
  }
  if (summary.error || detail.error) {
    return (
      <State
        title="Dashboard unavailable"
        description={summary.error ?? detail.error ?? "Data tidak tersedia."}
      />
    );
  }

  const child = detail.data?.child;
  const progress = child ? (summary.data?.progressByChild?.[child.id] ?? {}) : {};

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Dashboard Guru, ${user?.fullName ?? ""}`}
        description="Ringkasan perkembangan sosial siswa dan observasi pembelajaran terbaru."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Siswa terhubung" value={String(summary.data?.children?.length ?? 0)} />
        <Metric
          icon={BarChart3}
          label="Komunikasi kelas"
          value={`${progress.communication_score ?? 0}%`}
        />
        <Metric
          icon={ClipboardList}
          label="Observasi"
          value={String(detail.data?.observations?.length ?? 0)}
        />
        <Metric
          icon={GraduationCap}
          label="Aktivitas"
          value={String(detail.data?.activities?.length ?? 0)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Entries
          title="Observasi terbaru"
          items={detail.data?.observations ?? []}
          field="observation"
        />
        <Entries
          title="Aktivitas siswa terbaru"
          items={detail.data?.activities ?? []}
          field="detail"
        />
      </div>
    </div>
  );
}

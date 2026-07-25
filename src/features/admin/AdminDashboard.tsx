import { Users, Baby, Library, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { useAuth } from "@/lib/auth";
import { loadAdminStats, useSociovaQuery } from "@/lib/sociova-data";
import { ROLE_LABELS, type AuthRole } from "@/lib/roles";

export function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useSociovaQuery(loadAdminStats);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Memuat ringkasan…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="rounded-2xl p-6">
          <div className="font-display text-lg font-bold">Data tidak tersedia</div>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  const byRole = data?.byRole ?? {};

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Admin, ${user?.fullName ?? ""}`}
        description="Ringkasan sistem Sociova: pengguna, anak, materi, dan komunitas."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Pengguna" value={String(data?.users ?? 0)} />
        <Metric icon={Baby} label="Profil anak" value={String(data?.children ?? 0)} />
        <Metric icon={Library} label="Materi aktif" value={String(data?.resources ?? 0)} />
        <Metric icon={MessageSquare} label="Post komunitas" value={String(data?.posts ?? 0)} />
      </div>

      <Card className="rounded-2xl border-border/60 bg-card/60 p-6">
        <h2 className="font-display text-lg font-bold">Pengguna per role</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["child", "parent", "teacher", "therapist", "admin"] as AuthRole[]).map((role) => (
            <div key={role} className="rounded-xl border border-border/60 bg-background/30 p-4">
              <div className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</div>
              <div className="mt-1 font-display text-2xl font-bold">{byRole[role] ?? 0}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

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

import { createFileRoute } from "@tanstack/react-router";
import { Activity, ClipboardList, HeartPulse, Sparkles, UserRound, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { useAuth } from "@/lib/auth";
import { loadRoleDashboardData, loadRoleDetailData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/therapist")({ component: TherapistClients });

export function TherapistDashboard() {
  const { user } = useAuth();
  const summary = useSociovaQuery(() => loadRoleDashboardData("therapist"));
  const detail = useSociovaQuery(loadRoleDetailData);
  if (summary.loading || detail.loading) return <StateCard title="Loading dashboard" description="Memuat data klien dan catatan terapi." />;
  if (summary.error || detail.error) return <StateCard title="Dashboard unavailable" description={summary.error ?? detail.error ?? "Data tidak tersedia."} />;
  const child = detail.data?.child ?? summary.data?.children?.[0];
  const progress = child ? summary.data?.progressByChild?.[child.id] ?? {} : {};
  const notes = detail.data?.notes ?? [];
  const recommendations = detail.data?.recommendations ?? [];
  const activities = detail.data?.activities ?? [];

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title={`Dashboard Terapis, ${user?.fullName ?? ""}`} description="Ringkasan klinis untuk memantau perkembangan sosial dan regulasi emosi klien." />
    <div className="grid gap-4 md:grid-cols-4">
      <Metric icon={Users} label="Klien aktif" value={String(summary.data?.children?.length ?? 0)} hint="Terhubung ke akun Anda" />
      <Metric icon={HeartPulse} label="Kesiapan emosi" value={`${progress.empathy_score ?? 0}%`} hint="Skor empati dan regulasi" />
      <Metric icon={ClipboardList} label="Catatan sesi" value={String(notes.length)} hint="Tersimpan di MySQL" />
      <Metric icon={Activity} label="Aktivitas terbaru" value={String(activities.length)} hint="Latihan yang tercatat" />
    </div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="text-xs uppercase text-muted-foreground">Ringkasan klien</div>
        <h2 className="mt-1 font-display text-2xl font-bold">{child?.name ?? "Belum ada klien"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{child?.age ?? "-"} tahun · {child?.diagnosis_level ?? "Profil belum diisi"}</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm"><Score label="Komunikasi" value={progress.communication_score} /><Score label="Kepercayaan diri" value={progress.confidence_score} /><Score label="Empati" value={progress.empathy_score} /></div>
        <p className="mt-5 text-sm text-muted-foreground">Target saat ini: {child?.learning_goal ?? "Belum ada target."}</p>
      </Card>
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-[color:var(--brand)]" /> Rekomendasi terapi</div>
        <div className="mt-4 space-y-4">{recommendations.slice(0, 3).map((item: any) => <div key={item.id} className="border-b border-border/60 pb-3 last:border-0"><div className="font-medium">{item.title}</div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>)}</div>
      </Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2"><ListCard title="Catatan sesi terakhir" items={notes} textKey="note" empty="Belum ada catatan sesi." /><ListCard title="Aktivitas klien terbaru" items={activities} textKey="detail" empty="Belum ada aktivitas." /></div>
  </div>;
}

function TherapistClients() {
  const { data, loading, error } = useSociovaQuery(() => loadRoleDashboardData("therapist"));
  if (loading) return <StateCard title="Loading clients" description="Memuat daftar klien Anda." />;
  if (error) return <StateCard title="Clients unavailable" description={error} />;
  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="Clients" description="Daftar klien yang terhubung ke akun terapi Anda." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.children?.map((child: any) => { const progress = data.progressByChild?.[child.id] ?? {}; return <Card key={child.id} className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm"><div className="flex items-start justify-between"><div><div className="font-display text-xl font-bold">{child.name}</div><p className="mt-1 text-sm text-muted-foreground">{child.age} tahun · {child.diagnosis_level}</p></div><UserRound className="h-5 w-5 text-[color:var(--brand)]" /></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-background/40 p-3"><div className="text-muted-foreground">Komunikasi</div><div className="font-display text-xl font-bold">{progress.communication_score ?? 0}%</div></div><div className="rounded-xl bg-background/40 p-3"><div className="text-muted-foreground">Empati</div><div className="font-display text-xl font-bold">{progress.empathy_score ?? 0}%</div></div></div><p className="mt-4 text-sm text-muted-foreground">{child.learning_goal}</p></Card>; })}</div>
  </div>;
}
function Metric({ icon: Icon, label, value, hint }: any) { return <Card className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm"><Icon className="h-5 w-5 text-[color:var(--brand)]" /><div className="mt-3 text-xs text-muted-foreground">{label}</div><div className="font-display text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{hint}</div></Card>; }
function Score({ label, value }: any) { return <div className="rounded-xl bg-background/40 p-3"><div className="font-display text-xl font-bold">{value ?? 0}%</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>; }
function ListCard({ title, items, textKey, empty }: any) { return <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm"><h2 className="font-display text-lg font-bold">{title}</h2><div className="mt-4 space-y-3">{items.length ? items.slice(0, 3).map((item: any) => <div key={item.id} className="rounded-xl border border-border/60 bg-background/30 p-3"><div className="font-medium">{item.title}</div><p className="mt-1 text-sm text-muted-foreground">{item[textKey] ?? item.detail ?? "-"}</p></div>) : <p className="text-sm text-muted-foreground">{empty}</p>}</div></Card>; }
function StateCard({ title, description }: { title: string; description: string }) { return <div className="mx-auto max-w-6xl"><Card className="rounded-2xl border-border/60 bg-card/60 p-6"><div className="font-display text-lg font-bold">{title}</div><p className="mt-1 text-sm text-muted-foreground">{description}</p></Card></div>; }

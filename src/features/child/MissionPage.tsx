import { CheckCircle2, Target, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { loadDashboardData, useSociovaQuery } from "@/lib/sociova-data";


export function MissionPage() {
  const { data, loading, error } = useSociovaQuery(loadDashboardData);
  if (loading) return <State title="Loading mission" description="Menyiapkan misi hari ini." />;
  if (error || !data) return <State title="Mission unavailable" description={error ?? "Data misi belum tersedia."} />;
  const mission = data.dailyMission;
  const progress = data.missionProgress ?? { done: 0, total: mission?.target_count ?? 1, value: 0 };
  return <div className="mx-auto max-w-5xl space-y-6"><PageHeader title="Today's Mission" description="Selesaikan satu langkah kecil untuk melatih keterampilan sosial hari ini." /><Card className="rounded-2xl border-border/60 bg-card/60 p-7 backdrop-blur-sm"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase text-muted-foreground">Misi aktif</div><h2 className="mt-1 font-display text-2xl font-bold">{mission?.title ?? "Belum ada misi"}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{mission?.description}</p></div><Target className="h-7 w-7 text-[color:var(--brand)]" /></div><div className="mt-8"><div className="mb-2 flex justify-between text-sm"><span>Progress</span><span>{progress.done} dari {progress.total} langkah</span></div><Progress value={progress.value} className="h-3" /></div></Card><div className="grid gap-4 md:grid-cols-2"><Card className="rounded-2xl border-border/60 bg-card/60 p-5"><CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" /><div className="mt-3 font-semibold">Latihan singkat</div><p className="mt-1 text-sm text-muted-foreground">Gunakan simulasi AI untuk mencoba kalimat pembuka sebelum bertemu teman.</p></Card><Card className="rounded-2xl border-border/60 bg-card/60 p-5"><Trophy className="h-5 w-5 text-[color:var(--brand)]" /><div className="mt-3 font-semibold">Hadiah misi</div><p className="mt-1 text-sm text-muted-foreground">Selesaikan latihan untuk menambah XP dan memperpanjang streak.</p></Card></div></div>;
}
function State({ title, description }: { title: string; description: string }) { return <div className="mx-auto max-w-5xl"><Card className="rounded-2xl p-6"><div className="font-display text-lg font-bold">{title}</div><p className="mt-1 text-sm text-muted-foreground">{description}</p></Card></div>; }


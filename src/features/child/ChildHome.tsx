import { Link } from "@tanstack/react-router";
import {
  Flame,
  Trophy,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
  Bot,
  Smile,
  BookHeart,
  TrendingUp,
  Coins,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import { loadDashboardData, useSociovaQuery, formatShortDate } from "@/lib/sociova-data";
import { xpToCoins } from "@/lib/child-game";

export function ChildHome() {
  const { data, loading, error } = useSociovaQuery(loadDashboardData);

  if (loading) {
    return (
      <StateCard title="Loading dashboard" description="Sova sedang menyiapkan data belajar terbaru." />
    );
  }
  if (error) return <StateCard title="Dashboard data unavailable" description={error} />;
  if (!data) {
    return <StateCard title="No dashboard data" description="Data belum tersedia." />;
  }

  const missionProgress = data.missionProgress ?? {
    done: 0,
    total: 3,
    value: 0,
  };
  const weekXp = (data.weeklyBars ?? []).reduce(
    (sum: number, bar: any) => sum + (bar.xp || 0),
    0,
  );
  const weeklyPercent = Math.min(100, Math.round((weekXp / Math.max(weekXp, 300)) * 100) || 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Halo, ${data.child?.name ?? "Teman"}!`}
        description="Main bareng Sova: ketuk, pilih, dan kumpulkan XP. Mengetik tidak wajib."
        actions={
          <Button asChild className="rounded-full btn-brand border-0">
            <Link to="/dashboard/child/mission">
              Main misi hari ini <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <SovaBubble
        className="mb-6"
        message={`Halo, ${data.child?.name ?? "teman"}! Yuk ketuk misi atau pilih perasaan. Aku temani kamu!`}
      />
      {data.demoMode && (
        <Card className="mb-6 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
          Profil anak belum terhubung. Minta orang tua membuat akun anak di menu Kelola Anak.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="XP"
          value={Number(data.progress?.xp ?? 0).toLocaleString()}
          hint="Poin belajar"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Level"
          value={`Lv. ${data.progress?.level ?? 1}`}
          hint="Naik terus!"
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Koin"
          value={String(data.coins ?? xpToCoins(data.progress?.xp ?? 0))}
          hint="Hadiah Sova"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${data.progress?.streak ?? 0} hari`}
          hint="Berturut-turut"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Hari ini"
          value={`${missionProgress.done}/${missionProgress.total}`}
          hint={
            missionProgress.done >= missionProgress.total
              ? "Misi hari ini selesai!"
              : "Latihan hari ini"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Misi hari ini
              </div>
              <h2 className="mt-1 font-display text-xl font-bold">
                {data.dailyMission?.title ?? "Petualangan bersama Sova"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.dailyMission?.description ??
                  "Main game, pilih perasaan, atau baca cerita. Sova yang hitung."}
              </p>
            </div>
            <div className="hidden md:block">
              <Sova size={64} />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Sudah dikerjakan</span>
              <span>
                {missionProgress.done} dari {missionProgress.total}
              </span>
            </div>
            <Progress value={missionProgress.value} className="h-2" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-full btn-brand border-0">
              <Link to="/dashboard/child/mission">
                <Sparkles className="mr-1 h-4 w-4" /> Main misi
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/dashboard/child/emotion">Pilih perasaan</Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Minggu ini
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-display text-3xl font-bold text-gradient-brand">
              {weekXp > 0 ? `${weekXp} XP` : `${weeklyPercent}%`}
            </div>
            <TrendingUp className="h-4 w-4 text-[color:var(--success)]" />
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {(data.weeklyBars?.length
              ? data.weeklyBars
              : [0, 0, 0, 0, 0, 0, 0].map((xp) => ({ xp }))
            ).map((item: any, i: number) => {
              const max = Math.max(1, ...(data.weeklyBars ?? []).map((bar: any) => bar.xp || 0));
              const height = Math.max(8, Math.round(((item.xp || 0) / max) * 100));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-md bg-gradient-to-t from-[color:var(--brand)] to-[color:var(--brand-glow)]"
                  style={{ height: `${height}%` }}
                  title={`${item.d ?? ""} ${item.xp ?? 0} XP`}
                />
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <RecCard
          icon={<Bot className="h-4 w-4" />}
          title={data.recentSessions?.[0]?.scenario ?? "Bertemu Teman Baru"}
          subtitle={
            data.recentSessions?.[0]?.score
              ? `Score ${data.recentSessions[0].score}%`
              : undefined
          }
          to="/dashboard/child/simulation"
          tag="AI Simulation"
        />
        <RecCard
          icon={<Smile className="h-4 w-4" />}
          title={
            data.latestEmotion?.detected_emotion
              ? `Kenali rasa ${data.latestEmotion.detected_emotion}`
              : "Kenali Perasaanmu Hari Ini"
          }
          subtitle={
            data.latestEmotion?.created_at
              ? formatShortDate(data.latestEmotion.created_at)
              : undefined
          }
          to="/dashboard/child/emotion"
          tag="Emotion Analysis"
        />
        <RecCard
          icon={<BookHeart className="h-4 w-4" />}
          title={data.recentStories?.[0]?.title ?? "Cerita Sosial"}
          subtitle={
            data.recentStories?.[0]?.created_at
              ? formatShortDate(data.recentStories[0].created_at)
              : undefined
          }
          to="/dashboard/child/story"
          tag="Social Story"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function RecCard({
  icon,
  title,
  subtitle,
  to,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  to: string;
  tag: string;
}) {
  return (
    <Card className="group rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          {icon}
        </span>
        <span>{tag}</span>
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      <Link
        to={to as "/dashboard"}
        className="mt-3 inline-flex items-center text-sm text-[color:var(--brand)] hover:underline"
      >
        Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

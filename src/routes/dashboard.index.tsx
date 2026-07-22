import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { SovaBubble } from "@/components/site/sova";
import { loadDashboardData, useSociovaQuery, formatShortDate } from "@/lib/sociova-data";
import { useAuth } from "@/lib/auth";
import { TherapistDashboard } from "@/routes/dashboard.therapist";
import { ParentDashboard } from "@/routes/dashboard.parent";
import { TeacherDashboard } from "@/routes/dashboard.teacher";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { role, loading: authLoading } = useAuth();
  const { data, loading, error } = useSociovaQuery(loadDashboardData);

  if (authLoading) return <StateCard title="Loading dashboard" description="Menyiapkan ruang kerja Anda." />;
  if (role === "parent") return <ParentDashboard />;
  if (role === "teacher") return <TeacherDashboard />;
  if (role === "therapist") return <TherapistDashboard />;

  if (loading)
    return (
      <StateCard
        title="Loading dashboard"
        description="Sova sedang menyiapkan data belajar terbaru."
      />
    );
  if (error) return <StateCard title="Dashboard data unavailable" description={error} />;
  if (!data)
    return <StateCard title="No dashboard data" description="Demo data is shown for preview." />;

  const missionProgress = data.missionProgress ?? {
    done: 2,
    total: data.dailyMission.target_count ?? 4,
    value: 50,
  };
  const weeklyPercent = Math.round(
    ((data.progress.completed_missions ?? 0) /
      Math.max(data.progress.total_missions ?? data.weeklyMission.target_count ?? 6, 1)) *
      100,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome back, ${data.child.name} 👋`}
        description="Hari ini adalah kesempatan baru untuk berlatih. Yuk lanjutkan perjalanan belajarmu bersama Sova."
        actions={
          <Button asChild className="rounded-full btn-brand border-0">
            <Link to="/dashboard/simulation">
              Start today's session <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <SovaBubble
        className="mb-6"
        message={`Halo, ${data.child.name}! Siap latihan hari ini? Aku sudah menyiapkan misi baru untukmu.`}
      />
      {data.demoMode && <EmptyNotice />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="XP"
          value={Number(data.progress.xp ?? 0).toLocaleString()}
          hint="Learning points"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Level"
          value={`Lv. ${data.progress.level ?? 1}`}
          hint="Communicator"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${data.progress.streak ?? 0} days`}
          hint="Personal best"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Weekly goal"
          value={`${weeklyPercent}%`}
          hint={`${data.progress.completed_missions ?? 0} of ${data.progress.total_missions ?? data.weeklyMission.target_count ?? 6} missions`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Today's Mission
              </div>
              <h2 className="mt-1 font-display text-xl font-bold">{data.dailyMission.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{data.dailyMission.description}</p>
            </div>
            <div className="hidden h-16 w-16 items-center justify-center rounded-2xl btn-brand border-0 md:flex">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{missionProgress.done} / {missionProgress.total} steps</span>
            </div>
            <Progress value={missionProgress.value} className="h-2" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-full btn-brand border-0">
              <Link to="/dashboard/simulation">Continue</Link>
            </Button>
            <Button variant="outline" className="rounded-full">
              Skip for today
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Weekly Progress
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-display text-3xl font-bold text-gradient-brand">
              {weeklyPercent}%
            </div>
            <TrendingUp className="h-4 w-4 text-[color:var(--success)]" />
          </div>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {(data.weeklyBars?.length ? data.weeklyBars : [0,0,0,0,0,0,0].map((xp)=>({xp})) ).map((item: any, i: number) => {
              const max = Math.max(1, ...(data.weeklyBars ?? []).map((bar: any) => bar.xp || 0));
              const height = Math.max(8, Math.round(((item.xp || 0) / max) * 100));
              return (
              <div
                key={i}
                className="flex-1 rounded-md bg-gradient-to-t from-[color:var(--brand)] to-[color:var(--brand-glow)]"
                style={{ height: `${height}%` }}
                title={`${item.d ?? ""} ${item.xp ?? 0} XP`}
              />
            );})}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Recommendation
          icon={<Bot className="h-4 w-4" />}
          title={data.recentSessions[0]?.scenario ?? "Bertemu Teman Baru di Taman"}
          subtitle={
            data.recentSessions[0]?.score ? `Score ${data.recentSessions[0].score}%` : undefined
          }
          to="/dashboard/simulation"
          tag="AI Simulation"
        />
        <Recommendation
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
          to="/dashboard/emotion"
          tag="Emotion Analysis"
        />
        <Recommendation
          icon={<BookHeart className="h-4 w-4" />}
          title={data.recentStories[0]?.title ?? "Cerita: Hari Pertama di Sekolah"}
          subtitle={
            data.recentStories[0]?.created_at
              ? formatShortDate(data.recentStories[0].created_at)
              : undefined
          }
          to="/dashboard/story"
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

function EmptyNotice() {
  return (
    <Card className="mb-6 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
      No linked profile yet. Demo data is shown for preview.
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

function Recommendation({
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
        Open{" "}
        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}

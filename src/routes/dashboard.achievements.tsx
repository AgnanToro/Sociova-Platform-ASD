import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Flame, Star, Coins, Target, Sparkles, Award, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { loadAchievementsData, useSociovaQuery } from "@/lib/sociova-data";

export const Route = createFileRoute("/dashboard/achievements")({ component: AchievementsPage });

const badgeIcons = [Star, Flame, Trophy, Sparkles, Award, Zap];

function AchievementsPage() {
  const { data, loading, error } = useSociovaQuery(loadAchievementsData);
  if (loading)
    return (
      <StateCard title="Loading achievements" description="Sova sedang memuat badge dan progres." />
    );
  if (error) return <StateCard title="Achievements unavailable" description={error} />;
  const progress = data?.progress;
  const badges = data?.achievements ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Achievements" description="Every step counts. Keep collecting!" />
      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          No linked profile yet. Demo data is shown for preview.
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          icon={<Zap className="h-4 w-4" />}
          label="XP"
          value={Number(progress?.xp ?? 0).toLocaleString()}
        />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Level"
          value={String(progress?.level ?? 1)}
        />
        <Stat
          icon={<Coins className="h-4 w-4" />}
          label="Coins"
          value={String(Math.round((progress?.xp ?? 0) / 8))}
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${progress?.streak ?? 0}d`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" /> Daily Mission
          </div>
          <div className="mt-3 font-display text-lg font-bold">Sapa 3 teman dengan sopan.</div>
          <Progress value={66} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">2 of 3 done</div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" /> Weekly Mission
          </div>
          <div className="mt-3 font-display text-lg font-bold">Selesaikan 6 simulasi sosial.</div>
          <Progress value={66} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">4 of 6 done</div>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">Badges</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b, index) => {
          const Icon = badgeIcons[index % badgeIcons.length];
          return (
            <Card
              key={b.name}
              className={`rounded-2xl border-border/60 p-5 backdrop-blur-sm ${b.earned ? "bg-card/60" : "bg-card/30 opacity-70"}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${b.earned ? "btn-brand border-0" : "bg-secondary text-muted-foreground"}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-3 font-semibold">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.description}</div>
            </Card>
          );
        })}
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}

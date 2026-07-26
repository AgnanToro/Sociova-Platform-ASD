import { Trophy, Flame, Star, Coins, Target, Sparkles, Award, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import { loadAchievementsData, useSociovaQuery } from "@/lib/sociova-data";
import { levelProgress, xpToCoins } from "@/lib/child-game";

const badgeIcons = [Star, Flame, Trophy, Sparkles, Award, Zap];

export function AchievementsPage() {
  const { data, loading, error } = useSociovaQuery(loadAchievementsData);
  if (loading)
    return (
      <StateCard title="Loading" description="Sova memuat badge dan progresmu." />
    );
  if (error) return <StateCard title="Achievements gagal" description={error} />;

  const progress = data?.progress;
  const badges = data?.achievements ?? [];
  const coins = data?.coins ?? xpToCoins(progress?.xp ?? 0);
  const lp = levelProgress(progress?.xp ?? 0);
  const daily = data?.missionProgress ?? { done: 0, total: 4, value: 0 };
  const weekly = data?.weeklyProgress ?? { done: 0, total: 6, value: 0 };
  const earnedCount = badges.filter((b: any) => b.earned).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Piala & Hadiah"
        description="Kumpulkan XP, koin, dan badge bersama Sova!"
      />

      <SovaBubble
        message={
          earnedCount
            ? `Kamu punya ${earnedCount} badge. Level ${progress?.level ?? lp.level} — lanjut terus!`
            : "Belum ada badge. Main misi atau simulasi untuk membuka yang pertama!"
        }
      />

      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          Profil anak belum terhubung — data demo ditampilkan.
        </Card>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Stat icon={<Zap className="h-4 w-4" />} label="XP" value={Number(progress?.xp ?? 0).toLocaleString()} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Level" value={`Lv. ${progress?.level ?? lp.level}`} />
        <Stat icon={<Coins className="h-4 w-4" />} label="Koin" value={String(coins)} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${progress?.streak ?? 0} hari`} />
      </div>

      <Card className="mt-4 rounded-2xl border-border/60 bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Sova size={48} float={false} />
          <div className="flex-1">
            <div className="text-sm font-medium">Menuju level {lp.level + 1}</div>
            <Progress value={lp.percent} className="mt-2 h-2" />
            <div className="mt-1 text-xs text-muted-foreground">
              {lp.current} / {lp.needed} XP di level ini
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" /> Misi harian
          </div>
          <div className="mt-3 font-display text-lg font-bold">
            {data?.dailyMission?.title ?? "Selesaikan langkah misi hari ini"}
          </div>
          <Progress value={daily.value} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">
            {daily.done} dari {daily.total} selesai
          </div>
        </Card>
        <Card className="rounded-2xl border-border/60 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" /> Misi mingguan
          </div>
          <div className="mt-3 font-display text-lg font-bold">
            {data?.weeklyMission?.title ?? "Target latihan minggu ini"}
          </div>
          <Progress value={weekly.value} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">
            {weekly.done} dari {weekly.total} selesai
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-bold">Badge</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b: any, index: number) => {
          const Icon = badgeIcons[index % badgeIcons.length];
          return (
            <Card
              key={b.name}
              className={`rounded-2xl border-border/60 p-5 backdrop-blur-sm ${
                b.earned ? "bg-card/60" : "bg-card/30 opacity-70"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  b.earned ? "btn-brand border-0" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-3 font-semibold">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.description}</div>
              <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                {b.earned ? "Terbuka" : "Terkunci"}
              </div>
            </Card>
          );
        })}
        {!badges.length && (
          <Card className="rounded-2xl border-border/60 bg-card/60 p-5 text-sm text-muted-foreground">
            Badge akan muncul setelah kamu mulai latihan.
          </Card>
        )}
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

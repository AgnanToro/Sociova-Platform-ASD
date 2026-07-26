import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, CheckCircle2, Circle, Hand, Heart, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import { loadDashboardData, useSociovaQuery } from "@/lib/sociova-data";
import { DEFAULT_MISSION_STEPS, missionStepsFor } from "@/lib/child-game";
import { cn } from "@/lib/utils";

const STEP_ICONS = {
  hand: Hand,
  heart: Heart,
  bot: Bot,
  wind: Wind,
} as const;

export function MissionPage() {
  const { data, loading, error } = useSociovaQuery(loadDashboardData);

  const mission = data?.dailyMission;
  const progress = data?.missionProgress ?? {
    done: 0,
    total: 3,
    value: 0,
  };
  const steps = useMemo(() => {
    const fromApi = data?.missionSteps?.length
      ? data.missionSteps
      : missionStepsFor(progress.total ?? 3);
    return fromApi.length ? fromApi : DEFAULT_MISSION_STEPS;
  }, [data?.missionSteps, progress.total]);

  const doneCount = Math.min(progress.done ?? 0, steps.length);
  const total = Math.min(Math.max(progress.total ?? steps.length, 1), steps.length);
  const value = Math.min(100, Math.round((doneCount / Math.max(total, 1)) * 100));
  const left = Math.max(0, total - doneCount);

  if (loading) return <State title="Sebentar ya" description="Sova menyiapkan misi hari ini." />;
  if (error || !data)
    return <State title="Misi belum siap" description={error ?? "Coba refresh halaman."} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Today's Mission"
        description="Yuk main bareng Sova. Setiap latihan mengisi bintang misi hari ini."
      />

      <SovaBubble
        message={
          doneCount >= total
            ? "Wah hebat! Misi hari ini sudah selesai. Istirahat atau main Journey ya."
            : left === 1
              ? "Tinggal satu langkah lagi! Kamu pasti bisa."
              : `Ayo main. Masih ada ${left} langkah hari ini.`
        }
      />

      <Card className="rounded-2xl border-border/60 bg-card/60 p-7 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Misi hari ini</div>
            <h2 className="mt-1 font-display text-2xl font-bold">
              {mission?.title ?? "Petualangan harian bersama Sova"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {mission?.description ??
                "Main game, pilih perasaan, atau baca cerita. Sova menghitungnya untukmu."}
            </p>
          </div>
          <Sova size={64} />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span>Sudah dikerjakan</span>
            <span>
              {doneCount} dari {total}
            </span>
          </div>
          <Progress value={value} className="h-3" />
          <div className="mt-2 text-xs text-muted-foreground">
            Ketuk kartu di bawah untuk mulai. Sova yang menandai selesai.
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.slice(0, total).map((step: any, index: number) => {
          const done = index < doneCount;
          const Icon = STEP_ICONS[(step.icon as keyof typeof STEP_ICONS) ?? "hand"] ?? Hand;
          return (
            <Card
              key={step.id}
              className={cn(
                "rounded-2xl border-border/60 p-5 transition-all",
                done
                  ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/5"
                  : "bg-card/60 hover:-translate-y-0.5 hover:border-[color:var(--brand)]/40",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="font-semibold">{step.title}</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.hint}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.href && !done && (
                      <Button asChild size="sm" className="rounded-full btn-brand border-0">
                        <Link to={step.href as "/dashboard"}>Ayo main</Link>
                      </Button>
                    )}
                    {done && (
                      <span className="text-xs font-medium text-[color:var(--success)]">
                        Sudah selesai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function State({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <Card className="rounded-2xl p-6">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

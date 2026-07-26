import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Lock,
  MessageCircle,
  Smile,
  Bot,
  School,
  HeartHandshake,
  Presentation,
  Bus,
  PartyPopper,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";
import { Sova, SovaBubble } from "@/components/site/sova";
import { loadJourneyData, useSociovaQuery } from "@/lib/sociova-data";
import { scenarioForJourney } from "@/lib/journey-map";
import { stepCountForScenario } from "@/lib/simulation-scenes";
import { cn } from "@/lib/utils";

type JourneyStep = {
  id?: string;
  title: string;
  description: string;
  icon: string;
  status: "completed" | "in_progress" | "locked";
  xp_reward?: number;
  play_href?: string;
  scenario?: string;
};

const icons = {
  "message-circle": MessageCircle,
  smile: Smile,
  bot: Bot,
  school: School,
  "heart-handshake": HeartHandshake,
  presentation: Presentation,
  bus: Bus,
  "party-popper": PartyPopper,
  "messages-square": MessageCircle,
} as const;

export function JourneyPage() {
  const { data, loading, error } = useSociovaQuery(loadJourneyData);

  const steps: JourneyStep[] = data?.levels ?? [];
  const active = steps.find((s) => s.status === "in_progress") ?? steps.find((s) => s.status !== "locked");

  if (loading)
    return <StateCard title="Sedang memuat" description="Sova menyiapkan perjalananmu." />;
  if (error) return <StateCard title="Journey gagal dimuat" description={error} />;
  if (!steps.length)
    return (
      <StateCard title="Belum ada level" description="Konten journey akan muncul segera." />
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Perjalananmu"
        description="Mainkan game di setiap level. Selesaikan, dan level berikutnya akan terbuka."
      />

      <SovaBubble
        message={
          active
            ? `Sekarang giliran level ${active.title}. Yuk tekan Main dan selesaikan gamenya!`
            : "Semua level sudah selesai. Kamu hebat!"
        }
      />

      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          Profil anak belum terhubung — data demo ditampilkan.
        </Card>
      )}

      <div className="relative space-y-4">
        {steps.map((s, i) => {
          const Icon = icons[s.icon as keyof typeof icons] ?? MessageCircle;
          const scenario = s.scenario || scenarioForJourney(s.title);
          const qCount = stepCountForScenario(scenario);

          return (
            <Card
              key={s.id ?? s.title}
              className={cn(
                "flex items-start gap-4 rounded-2xl border-border/60 p-5 backdrop-blur-sm transition-all",
                s.status === "in_progress"
                  ? "border-[color:var(--brand)]/50 bg-[color:var(--brand)]/5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_35%,transparent),0_20px_60px_-20px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
                  : s.status === "completed"
                    ? "bg-card/60"
                    : "bg-card/40 opacity-80",
              )}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                    s.status === "completed"
                      ? "bg-[color:var(--brand)]/15 text-[color:var(--brand)]"
                      : s.status === "in_progress"
                        ? "btn-brand border-0 animate-float"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {s.status === "in_progress" ? (
                    <Sova size={36} float={false} glow={false} />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mt-2 h-10 w-1 rounded-full",
                      s.status === "completed" || s.status === "in_progress"
                        ? "bg-[color:var(--brand)]/40"
                        : "bg-border",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{s.title}</h3>
                  {s.status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                  )}
                  {s.status === "in_progress" && (
                    <span className="rounded-full bg-[color:var(--brand)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--brand)]">
                      MAIN SEKARANG
                    </span>
                  )}
                  {s.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
                  {s.xp_reward != null && (
                    <span className="text-xs text-muted-foreground">+{s.xp_reward} XP</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Game: {scenario} · {qCount} pertanyaan
                </p>

                {s.status === "locked" ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Selesaikan level sebelumnya dulu
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-full btn-brand border-0">
                      <Link
                        to="/dashboard/child/simulation"
                        search={{
                          scenario,
                          journey: s.id,
                        }}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" /> Main
                      </Link>
                    </Button>
                    {s.status === "completed" && (
                      <span className="self-center text-xs text-[color:var(--success)]">
                        Selesai
                      </span>
                    )}
                  </div>
                )}
              </div>
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

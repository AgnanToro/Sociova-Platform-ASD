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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/site/page-header";
import { loadJourneyData, useSociovaQuery } from "@/lib/sociova-data";

type JourneyStep = {
  title: string;
  description: string;
  icon: string;
  status: "completed" | "in_progress" | "locked";
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
} as const;

export function JourneyPage() {
  const { data, loading, error } = useSociovaQuery(loadJourneyData);
  if (loading)
    return <StateCard title="Loading journey" description="Sova sedang memuat level belajar." />;
  if (error) return <StateCard title="Journey unavailable" description={error} />;
  const steps = data?.levels ?? [];
  if (!steps.length)
    return (
      <StateCard
        title="No journey levels"
        description="Demo levels will appear once content is available."
      />
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Your Journey"
        description="Latihan bertahap untuk membangun keberanian dalam berinteraksi sosial."
      />
      {data?.demoMode && (
        <Card className="mb-4 rounded-2xl border-border/60 bg-card/60 p-4 text-sm text-muted-foreground backdrop-blur-sm">
          No linked profile yet. Demo data is shown for preview.
        </Card>
      )}
      <div className="relative space-y-4">
        {steps.map((s: JourneyStep, i: number) => (
          <Card
            key={s.title}
            className={`flex items-start gap-4 rounded-2xl border-border/60 p-5 backdrop-blur-sm transition-all ${
              s.status === "in_progress"
                ? "bg-[color:var(--brand)]/5 border-[color:var(--brand)]/50 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand)_35%,transparent),0_20px_60px_-20px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
                : "bg-card/60 hover:-translate-y-0.5 hover:border-[color:var(--brand)]/30"
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  s.status === "completed"
                    ? "bg-[color:var(--brand)]/15 text-[color:var(--brand)]"
                    : s.status === "in_progress"
                      ? "btn-brand border-0 animate-float"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {(() => {
                  const Icon = icons[s.icon as keyof typeof icons] ?? MessageCircle;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mt-2 h-8 w-px ${
                    s.status === "completed" || s.status === "in_progress"
                      ? "bg-[color:var(--brand)]/40"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.title}</h3>
                {s.status === "completed" && (
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                )}
                {s.status === "in_progress" && (
                  <span className="rounded-full bg-[color:var(--brand)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--brand)]">
                    IN PROGRESS
                  </span>
                )}
                {s.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </div>
          </Card>
        ))}
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

